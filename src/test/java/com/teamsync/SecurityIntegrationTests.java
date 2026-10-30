package com.teamsync;

import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.Loader;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamsync.entity.*;
import com.teamsync.enums.*;
import com.teamsync.repository.*;
import com.teamsync.security.JwtService;
import com.teamsync.service.ProjectService;
import com.teamsync.service.TaskService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.AccessDeniedException;
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
import static org.assertj.core.api.Assertions.*;
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
    @Autowired PasswordEncoder passwords;
    @Autowired JwtService tokens;
    @Autowired JwtEncoder encoder;
    @Autowired TransactionTemplate transaction;
    @Autowired TaskService taskService;
    @Autowired ProjectService projectService;

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
}
