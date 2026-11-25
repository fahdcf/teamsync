package com.teamsync;

import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.Loader;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamsync.entity.*;
import com.teamsync.enums.*;
import com.teamsync.exception.ValidationException;
import com.teamsync.repository.*;
import com.teamsync.security.JwtService;
import com.teamsync.dto.CommentRequestDTO;
import com.teamsync.patterns.behavioral.command.TaskCommandInvoker;
import com.teamsync.patterns.behavioral.observer.ProjectEvent;
import com.teamsync.patterns.behavioral.strategy.TaskAssignmentService;
import com.teamsync.patterns.creational.factory.WorkspaceStarterKitFactory;
import com.teamsync.patterns.creational.factory.WorkspaceStarterKitFactory.StarterProject;
import com.teamsync.dto.ProjectRequestDTO;
import com.teamsync.dto.TaskRequestDTO;
import com.teamsync.dto.UpdateProfileRequestDTO;
import com.teamsync.service.AnalyticsService;
import com.teamsync.service.CommentService;
import com.teamsync.service.ProjectService;
import com.teamsync.service.TaskService;
import com.teamsync.service.SubtaskService;
import com.teamsync.service.UserService;
import com.teamsync.service.WorkspaceService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SecurityIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired WorkspaceRepository workspaces;
    @Autowired ProjectRepository projects;
    @Autowired TaskRepository tasks;
    @Autowired CommentRepository comments;
    @Autowired NotificationRepository notifications;
    @Autowired TaskTemplateRepository templates;
    @Autowired ActivityLogRepository activityLogs;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtService tokens;
    @Autowired JwtEncoder encoder;
    @Autowired TransactionTemplate transaction;
    @Autowired TaskService taskService;
    @Autowired SubtaskService subtaskService;
    @Autowired ProjectService projectService;
    @Autowired AnalyticsService analyticsService;
    @Autowired WorkspaceService workspaceService;
    @Autowired UserService userService;
    @Autowired CommentService commentService;
    @Autowired TaskAssignmentService assignmentService;
    @Autowired TaskCommandInvoker commands;
    @Autowired ApplicationEventPublisher events;
    @SpyBean WorkspaceStarterKitFactory starterKits;

    User owner, manager, member, outsider, otherManager, admin;
    Workspace workspace, otherWorkspace;
    Project project, otherProject, unmanagedProject;
    Task task, otherTask;
    Comment comment;
    Notification notification;
    TaskTemplate template;

    @BeforeEach
    void seed() {
        transaction.executeWithoutResult(tx -> {
            String hash = passwords.encode("password123");
            owner = user(Role.TEAM_MEMBER, hash); manager = user(Role.PROJECT_MANAGER, hash);
            member = user(Role.TEAM_MEMBER, hash); outsider = user(Role.TEAM_MEMBER, hash);
            otherManager = user(Role.PROJECT_MANAGER, hash); admin = user(Role.ADMIN, hash);
            workspace = workspaces.save(Workspace.builder().name("Private workspace").owner(owner)
                    .members(new HashSet<>(List.of(manager, member, otherManager))).build());
            otherWorkspace = workspaces.save(Workspace.builder().name("Other workspace").owner(outsider).build());
            project = projects.save(Project.builder().title("Private project").workspace(workspace).manager(manager).build());
            unmanagedProject = projects.save(Project.builder().title("Unrelated project").workspace(workspace).manager(otherManager).build());
            otherProject = projects.save(Project.builder().title("Other project").workspace(otherWorkspace).manager(outsider).build());
            task = tasks.save(Task.builder().title("Private task").project(project).assignee(member).build());
            otherTask = tasks.save(Task.builder().title("Other task").project(otherProject).build());
            comment = comments.save(Comment.builder().content("Private comment").task(task).author(member).build());
            notification = notifications.save(Notification.builder().type(NotificationType.IN_APP).message("Private notification").recipient(member).build());
            template = templates.save(TaskTemplate.builder().templateName("Private template").title("Template task").projectId(project.getId()).build());
        });
    }

    User user(Role role, String hash) {
        String name = UUID.randomUUID().toString();
        return users.save(User.builder().username(name).email(name+"@test.example").password(hash).role(role).build());
    }
    ResultActions as(User user, MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer "+tokens.generateToken(user)));
    }
    MockHttpServletRequestBuilder body(MockHttpServletRequestBuilder request, Object body) throws Exception {
        return request.contentType("application/json").content(json.writeValueAsString(body));
    }
    String taskPath() { return "/tasks/"+task.getId(); }
    String projectPath() { return "/projects/"+project.getId(); }
    String workspacePath() { return "/workspaces/"+workspace.getId(); }

    @Test void anonymousAndMalformedTokensAreUnauthorized() throws Exception {
        mvc.perform(get("/projects")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.timestamp").exists());
        mvc.perform(get("/projects").header("Authorization", "Bearer invalid.token.value")).andExpect(status().isUnauthorized());
        mvc.perform(get("/users/me").header("Authorization", "Bearer ")).andExpect(status().isUnauthorized());
        mvc.perform(get("/public/health")).andExpect(status().isOk());
    }

    @Test void expiredWrongIssuerMissingExpiryAndUnknownIdentityTokensAreRejected() throws Exception {
        Instant now = Instant.now();
        for (JwtClaimsSet claims : List.of(
                JwtClaimsSet.builder().subject(member.getId().toString()).issuer("teamsync").issuedAt(now.minusSeconds(120)).expiresAt(now.minusSeconds(1)).build(),
                JwtClaimsSet.builder().subject(member.getId().toString()).issuer("wrong").issuedAt(now).expiresAt(now.plusSeconds(60)).build(),
                JwtClaimsSet.builder().subject(member.getId().toString()).issuer("teamsync").issuedAt(now).build(),
                JwtClaimsSet.builder().subject(UUID.randomUUID().toString()).issuer("teamsync").issuedAt(now).expiresAt(now.plusSeconds(60)).build())) {
            String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();
            mvc.perform(get("/users/me").header("Authorization", "Bearer "+token)).andExpect(status().isUnauthorized());
        }
        String valid = tokens.generateToken(member);
        String[] parts = valid.split("\\.");
        String forged = parts[0]+"."+Base64.getUrlEncoder().withoutPadding().encodeToString("{\"sub\":\"attacker\"}".getBytes())+"."+parts[2];
        mvc.perform(get("/users/me").header("Authorization", "Bearer "+forged)).andExpect(status().isUnauthorized());
    }

    @Test void registrationCannotGrantRolesAndLoginUsesEncodedPasswords() throws Exception {
        for(String role : List.of("ADMIN","PROJECT_MANAGER")) {
            mvc.perform(body(post("/auth/register"),Map.of("username","blocked","email","blocked@test.example","password","password123","role",role)))
                    .andExpect(status().isForbidden());
        }
        String name = UUID.randomUUID().toString();
        mvc.perform(body(post("/auth/register"),Map.of("username",name,"email",name+"@test.example","password","password123")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("TEAM_MEMBER")).andExpect(jsonPath("$.password").doesNotExist());
        assertThat(users.findByEmail(name+"@test.example").orElseThrow().getPassword()).startsWith("$2");
        String login = mvc.perform(body(post("/auth/login"),Map.of("email",name+"@test.example","password","password123")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        mvc.perform(get("/users/me").header("Authorization","Bearer "+json.readTree(login).get("token").asText())).andExpect(status().isOk());
        mvc.perform(body(post("/auth/login"),Map.of("email",member.getEmail(),"password","wrong"))).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings={"workspace","summary","workspaceProjects","workspaceActivity","project","tasks","task","comments","activity","stats","health","workload","report","blocked","templates"})
    void protectedReadsDoNotLeakAcrossWorkspaces(String resource) throws Exception {
        String path = switch(resource) {
            case "workspace" -> workspacePath(); case "summary" -> workspacePath()+"/summary";
            case "workspaceProjects" -> workspacePath()+"/projects"; case "workspaceActivity" -> workspacePath()+"/activity";
            case "project" -> projectPath(); case "tasks" -> projectPath()+"/tasks";
            case "task" -> taskPath(); case "comments" -> taskPath()+"/comments";
            case "activity" -> projectPath()+"/activity"; case "stats" -> "/analytics/projects/"+project.getId()+"/stats";
            case "health" -> "/analytics/projects/"+project.getId()+"/health";
            case "workload" -> "/analytics/projects/"+project.getId()+"/team-workload";
            case "report" -> "/reports/projects/"+project.getId(); case "blocked" -> projectPath()+"/tasks/blocked";
            default -> projectPath()+"/templates";
        };
        as(member,get(path)).andExpect(status().isOk());
        as(outsider,get(path)).andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Resource not found"));
    }

    @Test void listsSearchAnalyticsAndCalendarStayWithinMembership() throws Exception {
        for(String path : List.of("/projects","/tasks","/search?keyword=Private","/analytics/team/performance","/calendar/events","/dashboard/projects-overview")) {
            String data = as(outsider,get(path)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            assertThat(data).doesNotContain(project.getId().toString(),task.getId().toString(),workspace.getId().toString());
        }
        as(member,get("/projects")).andExpect(status().isOk()).andExpect(jsonPath("$[?(@.id == '"+project.getId()+"')]").isNotEmpty());
    }

    @Test void managementIsResourceScopedAndOrdinaryMembersCannotManage() throws Exception {
        var change = Map.of("title","Edited project");
        as(member,body(put(projectPath()),change)).andExpect(status().isForbidden());
        as(otherManager,body(put(projectPath()),change)).andExpect(status().isForbidden());
        as(manager,body(put(projectPath()),change)).andExpect(status().isOk());
        as(manager,put("/projects/"+unmanagedProject.getId()+"/archive")).andExpect(status().isForbidden());
        as(outsider,body(post(workspacePath()+"/projects"),change)).andExpect(status().isNotFound());
        as(member,body(post(workspacePath()+"/projects"),change)).andExpect(status().isForbidden());
        as(manager,body(post(workspacePath()+"/projects"),change)).andExpect(status().isCreated());
        as(owner,put(projectPath()+"/archive")).andExpect(status().isOk());
        as(admin,put("/projects/"+otherProject.getId()+"/archive")).andExpect(status().isOk());
    }

    @Test void taskCreationUpdateAssignmentAndAutoAssignmentAreProtected() throws Exception {
        var change = Map.of("title","New task");
        as(member,body(post(projectPath()+"/tasks"),change)).andExpect(status().isForbidden());
        as(outsider,body(post(projectPath()+"/tasks"),change)).andExpect(status().isNotFound());
        as(otherManager,body(post(projectPath()+"/tasks"),change)).andExpect(status().isForbidden());
        as(manager,body(post(projectPath()+"/tasks"),Map.of("title","Assigned task","assigneeId",member.getId()))).andExpect(status().isCreated());
        as(manager,body(put(taskPath()),Map.of("title","Stolen assignment","assigneeId",outsider.getId()))).andExpect(status().isBadRequest());
        as(member,body(put(taskPath()+"/assign"),Map.of("userId",owner.getId()))).andExpect(status().isForbidden());
        as(manager,body(put(taskPath()+"/assign"),Map.of("userId",outsider.getId()))).andExpect(status().isBadRequest());
        as(manager,body(put(taskPath()+"/assign"),Map.of("userId",owner.getId()))).andExpect(status().isOk());
        as(manager,body(post(projectPath()+"/tasks/auto-assign"),Map.of("taskId",otherTask.getId()))).andExpect(status().isNotFound());
        Task sameWorkspace = tasks.save(Task.builder().title("Other manager task").project(unmanagedProject).build());
        as(manager,body(post(projectPath()+"/tasks/auto-assign"),Map.of("taskId",sameWorkspace.getId()))).andExpect(status().isForbidden());
        as(manager,body(post(projectPath()+"/tasks/auto-assign"),Map.of("taskId",task.getId()))).andExpect(status().isOk());
    }

    @Test void statusTransitionsAndSubtasksEnforcePermissionsAndMembership() throws Exception {
        as(otherManager,body(put(taskPath()+"/status"),Map.of("status","IN_PROGRESS"))).andExpect(status().isForbidden());
        as(member,body(put(taskPath()+"/status"),Map.of("status","DONE"))).andExpect(status().isBadRequest());
        as(member,body(put(taskPath()+"/status"),Map.of("status","IN_PROGRESS"))).andExpect(status().isOk());
        as(manager,body(post(taskPath()+"/subtasks"),Map.of("title","Invalid subtask","assigneeId",outsider.getId()))).andExpect(status().isBadRequest());
        String result=as(manager,body(post(taskPath()+"/subtasks"),Map.of("title","Valid subtask","assigneeId",member.getId())))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        as(member,put(taskPath()+"/subtasks/"+json.readTree(result).get("id").asText()+"/toggle")).andExpect(status().isOk());
        as(member,body(put(taskPath()),Map.of("title","Cannot alter priority","priority","CRITICAL"))).andExpect(status().isForbidden());
        as(manager,body(post(projectPath()+"/tasks"),Map.of("title","Bypass state machine","status","DONE"))).andExpect(status().isBadRequest());
    }

    @Test void workspaceAndManagerChangesCannotBeEscalated() throws Exception {
        as(member,body(post(workspacePath()+"/members"),Map.of("userId",outsider.getId()))).andExpect(status().isForbidden());
        as(manager,delete(workspacePath()+"/members/"+member.getId())).andExpect(status().isForbidden());
        as(member,get(workspacePath()+"/available-members")).andExpect(status().isForbidden());
        as(manager,body(put(projectPath()),Map.of("title","Transfer","managerId",otherManager.getId()))).andExpect(status().isForbidden());
        as(owner,body(put(projectPath()),Map.of("title","Transfer","managerId",outsider.getId()))).andExpect(status().isBadRequest());
        as(owner,body(put(projectPath()),Map.of("title","Transfer","managerId",otherManager.getId()))).andExpect(status().isOk());
        as(manager,put(projectPath()+"/archive")).andExpect(status().isForbidden());
    }

    @Test void profilesRolesNotificationsAndCommentsAreProtected() throws Exception {
        as(member,body(put("/users/me"),Map.of("role","ADMIN"))).andExpect(status().isForbidden());
        as(admin,body(put("/users/me"),Map.of("role","TEAM_MEMBER"))).andExpect(status().isForbidden());
        as(member,body(put("/users/"+member.getId()+"/role"),Map.of("role","ADMIN"))).andExpect(status().isForbidden());
        as(member,get("/users")).andExpect(status().isForbidden());
        as(admin,get("/users")).andExpect(status().isOk());
        as(outsider,put("/notifications/"+notification.getId()+"/read")).andExpect(status().isNotFound());
        as(member,put("/notifications/"+notification.getId()+"/read")).andExpect(status().isOk());
        as(manager,delete("/comments/"+comment.getId())).andExpect(status().isForbidden());
        as(outsider,body(post("/comments/"+comment.getId()+"/replies"),Map.of("content","intrusion"))).andExpect(status().isNotFound());
        as(member,body(post(taskPath()+"/comments"),Map.of("content","collaboration"))).andExpect(status().isCreated());
    }

    @Test void roleAndMembershipRevocationAffectAlreadyIssuedTokens() throws Exception {
        String token=tokens.generateToken(manager);
        as(admin,body(put("/users/"+manager.getId()+"/role"),Map.of("role","TEAM_MEMBER"))).andExpect(status().isOk());
        mvc.perform(put(projectPath()+"/archive").header("Authorization","Bearer "+token)).andExpect(status().isForbidden());
        String memberToken=tokens.generateToken(member);
        as(owner,delete(workspacePath()+"/members/"+member.getId())).andExpect(status().isNoContent());
        mvc.perform(get(taskPath()).header("Authorization","Bearer "+memberToken)).andExpect(status().isNotFound());
        mvc.perform(get("/tasks").header("Authorization","Bearer "+memberToken)).andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());
    }

    @Test void passwordChangeRevokesOldTokensAndEmailChangeKeepsStableIdentity() throws Exception {
        String token=tokens.generateToken(member);
        as(member,body(put("/users/me"),Map.of("email",UUID.randomUUID()+"@test.example"))).andExpect(status().isOk());
        mvc.perform(get("/users/me").header("Authorization","Bearer "+token)).andExpect(status().isOk());
        mvc.perform(body(put("/users/me/password"),Map.of("currentPassword","password123","newPassword","newpassword123"))
                .header("Authorization","Bearer "+token)).andExpect(status().isNoContent());
        mvc.perform(get("/users/me").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());
    }

    @Test void dependenciesTemplatesAndReorderCannotCrossResourcesOrPartiallyWrite() throws Exception {
        as(manager,body(post(taskPath()+"/dependencies"),Map.of("dependsOnTaskId",otherTask.getId()))).andExpect(status().isNotFound());
        Task local = tasks.save(Task.builder().title("Other project task").project(unmanagedProject).build());
        as(manager,body(post(taskPath()+"/dependencies"),Map.of("dependsOnTaskId",local.getId()))).andExpect(status().isBadRequest());
        as(member,body(post("/tasks/from-template/"+template.getId()+"?projectId="+project.getId()),Map.of())).andExpect(status().isForbidden());
        as(outsider,post("/tasks/from-template/"+template.getId()+"?projectId="+otherProject.getId())).andExpect(status().isNotFound());
        as(manager,post("/tasks/from-template/"+template.getId()+"?projectId="+project.getId())).andExpect(status().isCreated());
        as(manager,body(put(projectPath()+"/tasks/reorder"),Map.of("taskIds",List.of(task.getId(),otherTask.getId())))).andExpect(status().isBadRequest());
        assertThat(tasks.findById(task.getId()).orElseThrow().getPosition()).isNull();
    }

    @Test void undoRechecksPermissionsAndDeleteRestoresCommentsAndSubtasks() throws Exception {
        as(manager,body(put(taskPath()+"/assign"),Map.of("userId",owner.getId()))).andExpect(status().isOk());
        as(owner,delete(workspacePath()+"/members/"+manager.getId())).andExpect(status().isNoContent());
        as(manager,post("/tasks/undo")).andExpect(status().isNotFound());
        as(owner,body(post(taskPath()+"/subtasks"),Map.of("title","Preserve subtask"))).andExpect(status().isCreated());
        as(owner,delete(taskPath())).andExpect(status().isNoContent());
        assertThat(tasks.existsById(task.getId())).isFalse();
        as(owner,post("/tasks/undo")).andExpect(status().isOk());
        JsonNode restored=json.readTree(as(owner,get(projectPath()+"/tasks")).andReturn().getResponse().getContentAsString()).get(0);
        assertThat(restored.get("title").asText()).isEqualTo(task.getTitle());
        assertThat(restored.get("subtasks")).hasSize(1);
        assertThat(restored.get("commentCount").asInt()).isEqualTo(1);
    }

    @Test @WithMockUser(username="missing@test.example")
    void springManagedServicesEnforceSecurityOutsideControllers() {
        assertThatThrownBy(() -> projectService.archive(project.getId())).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> taskService.delete(task.getId(),member.getId())).isInstanceOf(AccessDeniedException.class);
    }

    @Test @WithMockUser
    void simplifiedServiceEntryPointsRetainMethodAuthorization() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(member.getEmail(), "unused", List.of()));
        TaskRequestDTO taskRequest = new TaskRequestDTO();
        taskRequest.setTitle("Unauthorized task");
        ProjectRequestDTO projectRequest = new ProjectRequestDTO();
        projectRequest.setTitle("Unauthorized project");
        UpdateProfileRequestDTO profileRequest = new UpdateProfileRequestDTO();
        profileRequest.setRole(Role.ADMIN);

        assertThatThrownBy(() -> taskService.create(project.getId(), taskRequest)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> taskService.update(task.getId(), taskRequest)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> projectService.create(workspace.getId(), projectRequest)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> projectService.update(project.getId(), projectRequest)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> projectService.archive(project.getId())).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> projectService.initializeProject(workspace.getId(), "Unauthorized", manager.getEmail()))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> workspaceService.getAvailableMembers(workspace.getId())).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> analyticsService.getTeamPerformance(owner.getEmail(), null, null, null, null))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> analyticsService.getInsights(owner.getEmail(), null, null, null, null))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> userService.updateUsername(owner.getEmail(), "Unauthorized")).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> userService.updateProfile(member.getEmail(), profileRequest)).isInstanceOf(AccessDeniedException.class);
    }

    @Test void simplifiedMutationsKeepAuthenticatedAuditActorAndInitialization() throws Exception {
        String createdTask = as(manager, body(post(projectPath()+"/tasks"),
                Map.of("title", "Audit task", "assigneeId", member.getId())))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String createdTaskId = json.readTree(createdTask).get("id").asText();
        as(manager, body(put("/tasks/"+createdTaskId), Map.of("title", "Updated audit task"))).andExpect(status().isOk());
        List<JsonNode> taskActivity = new ArrayList<>();
        json.readTree(as(owner, get(workspacePath()+"/activity")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).forEach(taskActivity::add);
        assertThat(taskActivity).extracting(entry -> entry.path("action").asText())
                .containsExactlyInAnyOrder("TASK_CREATED", "TASK_UPDATED");
        assertThat(taskActivity).allSatisfy(entry -> assertThat(entry.path("user").path("id").asText())
                .isEqualTo(manager.getId().toString()));

        for (String endpoint : List.of("create", "initialize")) {
            MockHttpServletRequestBuilder request = endpoint.equals("create")
                    ? body(post(workspacePath()+"/projects"), Map.of("title", "Audit project", "managerId", manager.getId()))
                    : body(post("/projects/initialize"), Map.of("workspaceId", workspace.getId(),
                            "projectTitle", "Initialized audit project", "managerEmail", manager.getEmail()));
            String createdProject = as(owner, request).andExpect(status().isCreated())
                    .andExpect(jsonPath("$.manager.id").value(manager.getId().toString()))
                    .andReturn().getResponse().getContentAsString();
            String createdProjectPath = "/projects/"+json.readTree(createdProject).get("id").asText();
            as(owner, body(put(createdProjectPath), Map.of("title", "Updated audit project"))).andExpect(status().isOk());
            as(owner, put(createdProjectPath+"/archive")).andExpect(status().isOk());
            List<JsonNode> projectActivity = new ArrayList<>();
            json.readTree(as(owner, get(createdProjectPath+"/activity")).andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString()).forEach(projectActivity::add);
            assertThat(projectActivity).extracting(entry -> entry.path("action").asText())
                    .containsExactlyInAnyOrder("PROJECT_CREATED", "PROJECT_UPDATED", "PROJECT_ARCHIVED");
            assertThat(projectActivity).allSatisfy(entry -> assertThat(entry.path("user").path("id").asText())
                    .isEqualTo(owner.getId().toString()));
        }
    }

    @Test void simplifiedTaskUpdateRollsBackEarlierChangesWhenTransitionFails() throws Exception {
        as(manager, body(put(taskPath()), Map.of("title", "Must roll back", "priority", "CRITICAL", "status", "DONE")))
                .andExpect(status().isBadRequest());
        Task unchanged = tasks.findById(task.getId()).orElseThrow();
        assertThat(unchanged.getTitle()).isEqualTo(task.getTitle());
        assertThat(unchanged.getPriority()).isEqualTo(task.getPriority());
        assertThat(unchanged.getStatus()).isEqualTo(TaskStatus.TODO);
        as(owner, get(workspacePath()+"/activity")).andExpect(jsonPath("$[?(@.action == 'TASK_UPDATED')]").isEmpty());
    }

    @Test @WithMockUser
    void projectLookupOverloadsKeepDistinctFavoriteBehavior() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(manager.getEmail(), "unused", List.of()));
        assertThat(projectService.toggleFavorite(project.getId(), manager.getEmail()).isFavorite()).isTrue();
        assertThat(projectService.findById(project.getId(), manager.getEmail()).isFavorite()).isTrue();
        assertThat(projectService.findById(project.getId()).isFavorite()).isFalse();
    }

    @Test @WithMockUser
    void usernameAndProfileEntryPointsKeepUpdatesAndRollback() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(member.getEmail(), "unused", List.of()));
        String username = UUID.randomUUID().toString();
        assertThat(userService.updateUsername(member.getEmail(), username).getUsername()).isEqualTo(username);
        UpdateProfileRequestDTO request = new UpdateProfileRequestDTO();
        request.setUsername(UUID.randomUUID().toString());
        request.setEmail(owner.getEmail());
        assertThatThrownBy(() -> userService.updateProfile(member.getEmail(), request)).isInstanceOf(ValidationException.class);
        assertThat(users.findById(member.getId()).orElseThrow().getUsername()).isEqualTo(username);
        request.setEmail(member.getEmail());
        assertThat(userService.updateProfile(member.getEmail(), request).getUsername()).isEqualTo(request.getUsername());
        assertThat(users.findById(member.getId()).orElseThrow().getRole()).isEqualTo(Role.TEAM_MEMBER);
    }

    @ParameterizedTest
    @ValueSource(strings={"updateTask","deleteTask","assign","autoAssign","reorder","dependency","removeDependency","subtask","template","projectUpdate","archive","workspaceUpdate","addMember","removeMember"})
    void memberCannotUseAlternateManagementPaths(String action) throws Exception {
        MockHttpServletRequestBuilder request = switch(action) {
            case "updateTask" -> body(put(taskPath()),Map.of("title","Unauthorized"));
            case "deleteTask" -> delete(taskPath());
            case "assign" -> body(put(taskPath()+"/assign"),Map.of("userId",owner.getId()));
            case "autoAssign" -> body(post(projectPath()+"/tasks/auto-assign"),Map.of("taskId",task.getId()));
            case "reorder" -> body(put(projectPath()+"/tasks/reorder"),Map.of("taskIds",List.of(task.getId())));
            case "dependency" -> body(post(taskPath()+"/dependencies"),Map.of("dependsOnTaskId",otherTask.getId()));
            case "removeDependency" -> delete(taskPath()+"/dependencies/"+otherTask.getId());
            case "subtask" -> body(post(taskPath()+"/subtasks"),Map.of("title","Unauthorized"));
            case "template" -> body(post(projectPath()+"/templates"),Map.of("templateName","Unauthorized","title","Unauthorized"));
            case "projectUpdate" -> body(put(projectPath()),Map.of("title","Unauthorized"));
            case "archive" -> put(projectPath()+"/archive");
            case "workspaceUpdate" -> body(put(workspacePath()),Map.of("name","Unauthorized"));
            case "addMember" -> body(post(workspacePath()+"/members"),Map.of("userId",outsider.getId()));
            default -> delete(workspacePath()+"/members/"+manager.getId());
        };
        as(member,request).andExpect(status().isForbidden());
    }

    @Test void permissionFlagsMatchBackendEnforcement() throws Exception {
        as(member,get(projectPath())).andExpect(jsonPath("$.canManage").value(false));
        as(manager,get(projectPath())).andExpect(jsonPath("$.canManage").value(true)).andExpect(jsonPath("$.canChangeManager").value(false));
        as(owner,get(workspacePath())).andExpect(jsonPath("$.canManage").value(true)).andExpect(jsonPath("$.canCreateProject").value(true));
        as(member,get(taskPath())).andExpect(jsonPath("$.canManage").value(false)).andExpect(jsonPath("$.canChangeStatus").value(true));
    }

    @Test void invalidRequestsHaveConsistentClientErrors() throws Exception {
        as(manager,put(taskPath()).contentType("application/json").content("{"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.timestamp").exists());
        as(member,get("/tasks/not-a-uuid")).andExpect(status().isBadRequest());
        as(member,get("/tasks/"+UUID.randomUUID())).andExpect(status().isNotFound());
        as(manager,body(post(projectPath()+"/tasks"),Map.of("title",""))).andExpect(status().isBadRequest());
    }

    @Test void authorizedReportsContainValidJsonCsvAndPdf() throws Exception {
        String path="/reports/projects/"+project.getId();
        as(member,get(path)).andExpect(status().isOk()).andExpect(jsonPath("$.totalTasks").value(1));
        as(member,get(path+"?format=csv")).andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("text/csv"));
        byte[] bytes=as(member,get(path+"?format=pdf&download=true")).andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf")).andExpect(header().exists("Content-Disposition"))
                .andReturn().getResponse().getContentAsByteArray();
        try(var pdf=Loader.loadPDF(bytes)) {
            assertThat(pdf.getNumberOfPages()).isGreaterThan(0);
            assertThat(new PDFTextStripper().getText(pdf)).contains("TeamSync project report","totalTasks: 1");
        }
        as(member,get(path+"?format=exe")).andExpect(status().isBadRequest());
    }

    @Test void statusAndAssignmentUndoPreserveLaterEditsAndValidateRestoredAssignees() throws Exception {
        as(member,body(put(taskPath()+"/status"),Map.of("status","IN_PROGRESS"))).andExpect(status().isOk());
        as(member,post("/tasks/undo")).andExpect(status().isOk());
        assertThat(tasks.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.TODO);
        as(manager,body(put(taskPath()+"/assign"),Map.of("userId",owner.getId()))).andExpect(status().isOk());
        as(owner,body(put(taskPath()),Map.of("title","Later edit"))).andExpect(status().isOk());
        as(manager,post("/tasks/undo")).andExpect(status().isOk());
        assertThat(tasks.findById(task.getId()).orElseThrow().getTitle()).isEqualTo("Later edit");
        as(manager,body(put(taskPath()+"/assign"),Map.of("userId",owner.getId()))).andExpect(status().isOk());
        as(owner,delete(workspacePath()+"/members/"+member.getId())).andExpect(status().isNoContent());
        as(manager,post("/tasks/undo")).andExpect(status().isBadRequest());
        assertThat(tasks.findById(task.getId()).orElseThrow().getAssignee().getId()).isEqualTo(owner.getId());
    }

    @Test void commentEventsNotifyOnlyTheAssigneeAndSkipSelfOrAbsentRecipients() throws Exception {
        long initial = notifications.count();
        as(manager, body(post(taskPath()+"/comments"), Map.of("content", "Review this task"))).andExpect(status().isCreated());
        List<Notification> received = notifications.findByRecipientAndReadStatusFalse(member);
        assertThat(received).hasSize(2).anySatisfy(n -> assertThat(n.getMessage())
                .isEqualTo(manager.getUsername()+" commented on task: "+task.getTitle()));
        assertThat(notifications.findByRecipientAndReadStatusFalse(manager)).isEmpty();
        as(member, body(post(taskPath()+"/comments"), Map.of("content", "My own task"))).andExpect(status().isCreated());
        as(outsider, body(post("/tasks/"+otherTask.getId()+"/comments"), Map.of("content", "Unassigned task")))
                .andExpect(status().isCreated());
        assertThat(notifications.count()).isEqualTo(initial+1);
        as(member, get("/notifications")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
    }

    @Test void assignmentAndStatusEventsRetainAssigneeMessagesWithoutNotifyingTheActor() throws Exception {
        as(manager, body(put(taskPath()+"/assign"), Map.of("userId", owner.getId()))).andExpect(status().isOk());
        as(manager, body(put(taskPath()+"/status"), Map.of("status", "IN_PROGRESS"))).andExpect(status().isOk());
        assertThat(notifications.findByRecipientAndReadStatusFalse(owner)).extracting(Notification::getMessage)
                .containsExactlyInAnyOrder("NOTIFY: [TASK_ASSIGNED] — "+task.getTitle()+" → "+owner.getUsername(),
                        "NOTIFY: [TASK_STATUS_CHANGED] — "+task.getTitle()+" → IN_PROGRESS");
        assertThat(notifications.findByRecipientAndReadStatusFalse(manager)).isEmpty();
        long beforeUnassigned = notifications.count();
        as(outsider, body(put("/tasks/"+otherTask.getId()+"/status"), Map.of("status", "IN_PROGRESS")))
                .andExpect(status().isOk());
        assertThat(notifications.count()).isEqualTo(beforeUnassigned);
    }

    @Test @WithMockUser
    void eventsWithoutRecipientsHaveNoPersistenceEffect() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(manager.getEmail(), "unused", List.of()));
        long before = notifications.count();
        transaction.executeWithoutResult(tx -> events.publishEvent(
                new ProjectEvent(ProjectEventType.TASK_ASSIGNED, "No recipient", null)));
        assertThat(notifications.count()).isEqualTo(before);
    }

    @ParameterizedTest @ValueSource(strings = {"assignment", "status", "comment"}) @WithMockUser
    void publishingTransactionRollbackRemovesNotificationsAuditAndUndoHistory(String operation) {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(manager.getEmail(), "unused", List.of()));
        long beforeNotifications = notifications.count();
        long beforeComments = comments.count();
        transaction.executeWithoutResult(tx -> {
            switch (operation) {
                case "assignment" -> taskService.assign(task.getId(), owner.getId(), manager.getId());
                case "status" -> taskService.changeStatus(task.getId(), TaskStatus.IN_PROGRESS, manager.getId());
                case "comment" -> {
                    CommentRequestDTO request = new CommentRequestDTO();
                    request.setContent("Rolled back comment");
                    commentService.addComment(task.getId(), request, manager.getEmail());
                }
                default -> throw new AssertionError(operation);
            }
            assertThat(notifications.count()).isEqualTo(beforeNotifications+1);
            assertThatThrownBy(() -> commands.peek(manager.getId())).isInstanceOf(IllegalStateException.class);
            tx.setRollbackOnly();
        });
        assertThat(notifications.count()).isEqualTo(beforeNotifications);
        assertThat(comments.count()).isEqualTo(beforeComments);
        assertThat(tasks.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(tasks.findById(task.getId()).orElseThrow().getAssignee().getId()).isEqualTo(member.getId());
        assertThatThrownBy(() -> commands.peek(manager.getId())).isInstanceOf(IllegalStateException.class);
        assertThat(activityLogs.findByEntityId(task.getId())).isEmpty();
    }

    @Test @WithMockUser
    void notificationListenerFailureRollsBackThePublishingTransaction() {
        var authentication = UsernamePasswordAuthenticationToken.authenticated(manager.getEmail(), "unused", List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        long beforeNotifications = notifications.count();
        boolean[] returnedFromListener = {false};
        assertThatThrownBy(() -> transaction.executeWithoutResult(tx -> {
            taskService.assign(task.getId(), owner.getId(), manager.getId());
            SecurityContextHolder.getContext().setAuthentication(null);
            try {
                events.publishEvent(new ProjectEvent(ProjectEventType.TASK_ASSIGNED, "Unauthorized listener", owner));
                returnedFromListener[0] = true;
            } finally {
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        })).isInstanceOf(AuthenticationCredentialsNotFoundException.class);
        assertThat(returnedFromListener[0]).isFalse();
        assertThat(notifications.count()).isEqualTo(beforeNotifications);
        assertThat(tasks.findById(task.getId()).orElseThrow().getAssignee().getId()).isEqualTo(member.getId());
        assertThat(activityLogs.findByEntityId(task.getId())).isEmpty();
        assertThatThrownBy(() -> commands.peek(manager.getId())).isInstanceOf(IllegalStateException.class);
    }

    @Test @WithMockUser
    void commitFailureAfterNotificationDispatchDoesNotPublishUndoHistory() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(manager.getEmail(), "unused", List.of()));
        long beforeNotifications = notifications.count();
        boolean[] returnedFromListener = {false};
        assertThatThrownBy(() -> transaction.executeWithoutResult(tx -> {
            taskService.assign(task.getId(), owner.getId(), manager.getId());
            // Exceed the existing VARCHAR(255) limit; no flush occurs until outer commit.
            events.publishEvent(new ProjectEvent(ProjectEventType.TASK_ASSIGNED, "x".repeat(300), owner));
            returnedFromListener[0] = true;
        })).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(returnedFromListener[0]).isTrue();
        assertThat(notifications.count()).isEqualTo(beforeNotifications);
        assertThat(tasks.findById(task.getId()).orElseThrow().getAssignee().getId()).isEqualTo(member.getId());
        assertThat(activityLogs.findByEntityId(task.getId())).isEmpty();
        assertThatThrownBy(() -> commands.peek(manager.getId())).isInstanceOf(IllegalStateException.class);
    }

    @Test @WithMockUser
    void rolledBackUndoKeepsCommittedHistoryForRetry() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(manager.getEmail(), "unused", List.of()));
        taskService.assign(task.getId(), owner.getId(), manager.getId());
        var command = commands.peek(manager.getId());
        transaction.executeWithoutResult(tx -> {
            taskService.undo(manager.getId());
            tx.setRollbackOnly();
        });
        assertThat(commands.peek(manager.getId())).isSameAs(command);
        assertThat(tasks.findById(task.getId()).orElseThrow().getAssignee().getId()).isEqualTo(owner.getId());
        taskService.undo(manager.getId());
        assertThat(tasks.findById(task.getId()).orElseThrow().getAssignee().getId()).isEqualTo(member.getId());
        assertThatThrownBy(() -> commands.peek(manager.getId())).isInstanceOf(IllegalStateException.class);
    }

    @Test void groupedWorkloadCountsOnlyInProgressCandidateTasksInTheSameWorkspace() {
        tasks.saveAll(List.of(
                Task.builder().title("Owner active").project(project).assignee(owner).status(TaskStatus.IN_PROGRESS).build(),
                Task.builder().title("Member active").project(project).assignee(member).status(TaskStatus.IN_PROGRESS).build(),
                Task.builder().title("Member active in another project").project(unmanagedProject).assignee(member).status(TaskStatus.IN_PROGRESS).build(),
                Task.builder().title("Other workspace").project(otherProject).assignee(owner).status(TaskStatus.IN_PROGRESS).build(),
                Task.builder().title("Completed").project(project).assignee(owner).status(TaskStatus.DONE).build(),
                Task.builder().title("Noncandidate").project(project).assignee(manager).status(TaskStatus.IN_PROGRESS).build()));
        var counts = tasks.countWorkloads(workspace.getId(), List.of(owner.getId(), member.getId()), TaskStatus.IN_PROGRESS)
                .stream().collect(java.util.stream.Collectors.toMap(TaskRepository.AssigneeWorkload::getAssigneeId,
                        TaskRepository.AssigneeWorkload::getTaskCount));
        assertThat(counts).containsExactlyInAnyOrderEntriesOf(Map.of(owner.getId(), 1L, member.getId(), 2L));
        transaction.executeWithoutResult(tx -> assertThat(assignmentService.autoAssign(tasks.findById(task.getId()).orElseThrow(),
                List.of(member, owner), "workload").getId()).isEqualTo(owner.getId()));
    }

    @ParameterizedTest @ValueSource(strings = {"workload", "roundrobin"})
    void bothAutoAssignmentEndpointsKeepWorkspaceCandidatesAndPermissions(String strategy) throws Exception {
        as(member, body(post(projectPath()+"/tasks/auto-assign").param("strategy", strategy), Map.of("taskId", task.getId())))
                .andExpect(status().isForbidden());
        String result = as(manager, body(post(projectPath()+"/tasks/auto-assign").param("strategy", strategy), Map.of("taskId", task.getId())))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(result).path("assignee").path("id").asText())
                .isIn(owner.getId().toString(), manager.getId().toString(), member.getId().toString(), otherManager.getId().toString());
    }

    @Test void catalogueKeepsItsResponseShapeAndReportsOnlyRetainedPatterns() throws Exception {
        String result = mvc.perform(get("/patterns")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<JsonNode> catalogue = new ArrayList<>();
        json.readTree(result).forEach(catalogue::add);
        assertThat(catalogue).extracting(entry -> entry.path("name").asText())
                .containsExactly("Singleton", "Simple Factory", "Prototype", "Observer", "Strategy", "Command");
        assertThat(catalogue).allSatisfy(entry -> {
            assertThat(entry.has("id") && entry.has("category") && entry.has("package") && entry.has("purpose")).isTrue();
            assertThat(entry.path("keyClasses").isArray()).isTrue();
        });
    }

    @ParameterizedTest @ValueSource(strings = {"SOFTWARE_DEVELOPMENT", "UNIVERSITY_PROJECT", "EVENT_PLANNING"})
    void starterKitsCreateOwnedProjectsWithOrdinaryEditableTasks(String kit) throws Exception {
        var expected = switch (kit) {
            case "SOFTWARE_DEVELOPMENT" -> Map.of("Product Development", 3, "Release Readiness", 2);
            case "UNIVERSITY_PROJECT" -> Map.of("Research and Delivery", 4);
            default -> Map.of("Event Logistics", 3, "Guest Communications", 2);
        };
        String created = as(member, body(post("/workspaces"), Map.of("name", "New workspace", "starterKit", kit)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.owner.id").value(member.getId().toString()))
                .andReturn().getResponse().getContentAsString();
        String id = json.readTree(created).path("id").asText();
        String path = "/workspaces/" + id + "/projects";
        var createdProjects = json.readTree(as(member, get(path)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(createdProjects.size()).isEqualTo(expected.size());
        for (JsonNode createdProject : createdProjects) {
            String projectId = createdProject.path("id").asText();
            assertThat(createdProject.path("workspaceId").asText()).isEqualTo(id);
            assertThat(createdProject.path("manager").path("id").asText()).isEqualTo(member.getId().toString());
            var createdTasks = json.readTree(as(member, get("/projects/" + projectId + "/tasks"))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
            assertThat(createdTasks.size()).isEqualTo(expected.get(createdProject.path("title").asText()));
            assertThat(createdTasks).allSatisfy(item -> {
                assertThat(item.path("projectId").asText()).isEqualTo(projectId);
                assertThat(item.path("status").asText()).isEqualTo("TODO");
            });
            String starterTaskPath = "/tasks/" + createdTasks.get(0).path("id").asText();
            as(outsider, body(put(starterTaskPath), Map.of("title", "Outside edit"))).andExpect(status().isNotFound());
            as(member, body(put(starterTaskPath), Map.of("title", "Edited starter task")))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Edited starter task"));
            as(member, delete(starterTaskPath)).andExpect(status().isNoContent());
        }
        as(outsider, get(path)).andExpect(status().isNotFound());
    }

    @Test void workspaceCreationStillSupportsEmptyAndRejectsInvalidOrAnonymousRequests() throws Exception {
        var request = Map.of("name", "Empty workspace", "starterKit", "NOT_A_KIT");
        long before = workspaces.count();
        mvc.perform(body(post("/workspaces"), request)).andExpect(status().isUnauthorized());
        as(member, body(post("/workspaces"), request)).andExpect(status().isBadRequest());
        assertThat(workspaces.count()).isEqualTo(before);

        String created = as(member, body(post("/workspaces"), Map.of("name", "Empty workspace")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        as(member, get("/workspaces/" + json.readTree(created).path("id").asText() + "/projects"))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @Test void starterKitRollsBackAllResourcesAndAuditsWhenALaterTaskFailsValidation() throws Exception {
        doReturn(List.of(new StarterProject("Build", List.of("Write tests", ""))))
                .when(starterKits).create("SOFTWARE_DEVELOPMENT");
        long workspaceCount = workspaces.count(), projectCount = projects.count(), taskCount = tasks.count();
        long auditCount = activityLogs.count();
        as(member, body(post("/workspaces"), Map.of("name", "Roll back", "starterKit", "SOFTWARE_DEVELOPMENT")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Task title must contain 1 to 100 characters"));
        assertThat(workspaces.count()).isEqualTo(workspaceCount);
        assertThat(projects.count()).isEqualTo(projectCount);
        assertThat(tasks.count()).isEqualTo(taskCount);
        assertThat(activityLogs.count()).isEqualTo(auditCount);
    }

    @Test void statusAndEditEndpointsEnforceChecklistAndUndoPreservesLaterSubtaskEdits() throws Exception {
        String subtaskJson = as(manager, body(post(taskPath() + "/subtasks"), Map.of("title", "Verify result")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String toggle = taskPath() + "/subtasks/" + json.readTree(subtaskJson).path("id").asText() + "/toggle";
        as(manager, body(post(projectPath() + "/tasks"), Map.of("title", "Initial review", "status", "IN_REVIEW")))
                .andExpect(status().isBadRequest());
        as(member, body(put(taskPath() + "/status"), Map.of("status", "IN_PROGRESS"))).andExpect(status().isOk());
        as(member, body(put(taskPath() + "/status"), Map.of("status", "IN_REVIEW")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Cannot send task to review: complete all subtasks first"));
        as(manager, body(put(taskPath()), Map.of("title", "Cannot bypass", "status", "IN_REVIEW")))
                .andExpect(status().isBadRequest());
        assertThat(tasks.findById(task.getId()).orElseThrow().getTitle()).isEqualTo(task.getTitle());

        as(member, put(toggle)).andExpect(status().isOk());
        as(member, body(put(taskPath() + "/status"), Map.of("status", "IN_REVIEW"))).andExpect(status().isOk());
        as(member, put(toggle)).andExpect(status().isOk());
        as(member, body(put(taskPath() + "/status"), Map.of("status", "DONE")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Cannot complete task: complete all subtasks first"));
        as(outsider, body(put(taskPath() + "/status"), Map.of("status", "DONE"))).andExpect(status().isNotFound());
        as(member, put(toggle)).andExpect(status().isOk());
        as(member, body(put(taskPath() + "/status"), Map.of("status", "DONE"))).andExpect(status().isOk());
        as(member, post("/tasks/undo")).andExpect(status().isOk());
        as(member, get(taskPath())).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("IN_REVIEW"))
                .andExpect(jsonPath("$.subtasks[0].completed").value(true));
    }

    @Test void concurrentReviewWaitsForSubtaskEditAndUsesTheCommittedChecklist() throws Exception {
        String subtaskJson = as(manager, body(post(taskPath() + "/subtasks"), Map.of("title", "Verify result")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        UUID subtaskId = UUID.fromString(json.readTree(subtaskJson).path("id").asText());
        as(member, put(taskPath() + "/subtasks/" + subtaskId + "/toggle")).andExpect(status().isOk());
        as(member, body(put(taskPath() + "/status"), Map.of("status", "IN_PROGRESS"))).andExpect(status().isOk());

        ExecutorService executor = Executors.newSingleThreadExecutor();
        CountDownLatch editStarted = new CountDownLatch(1);
        CountDownLatch letEditCommit = new CountDownLatch(1);
        try {
            Future<?> edit = executor.submit(() -> {
                SecurityContextHolder.getContext().setAuthentication(
                        UsernamePasswordAuthenticationToken.authenticated(member.getEmail(), "unused", List.of()));
                try {
                    transaction.executeWithoutResult(tx -> {
                        subtaskService.toggleSubtask(task.getId(), subtaskId);
                        editStarted.countDown();
                        try {
                            if (!letEditCommit.await(10, TimeUnit.SECONDS)) throw new AssertionError("Edit timed out");
                        } catch (InterruptedException ex) {
                            Thread.currentThread().interrupt();
                            throw new AssertionError(ex);
                        }
                    });
                } finally {
                    SecurityContextHolder.clearContext();
                }
            });
            assertThat(editStarted.await(10, TimeUnit.SECONDS)).isTrue();
            CompletableFuture<ResultActions> review = CompletableFuture.supplyAsync(() -> {
                try {
                    return as(member, body(put(taskPath() + "/status"), Map.of("status", "IN_REVIEW")));
                } catch (Exception ex) {
                    throw new CompletionException(ex);
                }
            });
            assertThatThrownBy(() -> review.get(200, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
            letEditCommit.countDown();
            edit.get(10, TimeUnit.SECONDS);
            review.get(10, TimeUnit.SECONDS).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Cannot send task to review: complete all subtasks first"));
        } finally {
            letEditCommit.countDown();
            executor.shutdownNow();
        }
    }

    @ParameterizedTest @ValueSource(strings = {"json", " CSV ", "pDf"})
    void exportsKeepExactContentTypesFilenamesAndValidationOrder(String format) throws Exception {
        String extension = format.trim().toLowerCase(Locale.ROOT);
        String contentType = switch (extension) {
            case "csv" -> "text/csv";
            case "pdf" -> "application/pdf";
            default -> "application/json";
        };
        String path = "/reports/projects/"+project.getId();
        as(member, get(path).param("format", format)).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, contentType))
                .andExpect(header().doesNotExist(HttpHeaders.CONTENT_DISPOSITION));
        as(member, get(path).param("format", format).param("download", "true")).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, contentType))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"teamsync-project-report-"+project.getId()+"."+extension+"\""));
        as(outsider, get(path).param("format", format)).andExpect(status().isNotFound());
        as(outsider, get(path).param("format", "invalid")).andExpect(status().isBadRequest());
    }
}
