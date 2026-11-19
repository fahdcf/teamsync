package com.teamsync;

import com.teamsync.entity.Project;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.entity.Workspace;
import com.teamsync.enums.TaskStatus;
import com.teamsync.patterns.behavioral.strategy.RoundRobinStrategy;
import com.teamsync.patterns.behavioral.strategy.TaskAssignmentService;
import com.teamsync.patterns.behavioral.strategy.WorkloadStrategy;
import com.teamsync.repository.TaskRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AssignmentStrategyTests {
    private final TaskRepository tasks = mock(TaskRepository.class);
    private final WorkloadStrategy workload = new WorkloadStrategy(tasks);
    private final RoundRobinStrategy roundRobin = new RoundRobinStrategy();
    private final List<User> members = IntStream.range(0, 3)
            .mapToObj(i -> User.builder().id(UUID.randomUUID()).build()).toList();
    private final Task task = Task.builder().project(Project.builder().id(UUID.randomUUID())
            .workspace(Workspace.builder().id(UUID.randomUUID()).build()).build()).build();

    @Test void workloadUsesOneGroupedQueryAndKeepsCandidateOrderForTies() {
        UUID workspaceId = task.getProject().getWorkspace().getId();
        List<UUID> memberIds = members.stream().map(User::getId).toList();
        TaskRepository.AssigneeWorkload count = mock(TaskRepository.AssigneeWorkload.class);
        when(count.getAssigneeId()).thenReturn(members.get(0).getId());
        when(count.getTaskCount()).thenReturn(4L);
        when(tasks.countWorkloads(workspaceId, memberIds, TaskStatus.IN_PROGRESS)).thenReturn(List.of(count));
        assertThat(workload.assign(members, task)).isSameAs(members.get(1));
        verify(tasks).countWorkloads(workspaceId, memberIds, TaskStatus.IN_PROGRESS);
        verifyNoMoreInteractions(tasks);
    }

    @Test void selectionReusesRoundRobinAndRetainsCaseInsensitiveNamesAndErrors() {
        TaskAssignmentService service = new TaskAssignmentService(workload, roundRobin);
        assertThat(service.autoAssign(task, members, "ROUNDROBIN")).isSameAs(members.get(0));
        assertThat(service.autoAssign(task, members, "roundrobin")).isSameAs(members.get(1));
        assertThat(service.autoAssign(task, members, "roundrobin")).isSameAs(members.get(2));
        assertThat(service.autoAssign(task, members, "roundrobin")).isSameAs(members.get(0));
        assertThatThrownBy(() -> service.autoAssign(task, members, "unknown"))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Unknown assignment strategy");
        assertThatThrownBy(() -> service.autoAssign(task, List.of(), "workload"))
                .isInstanceOf(IllegalStateException.class).hasMessage("No members available");
        assertThatThrownBy(() -> service.autoAssign(task, List.of(), "roundrobin"))
                .isInstanceOf(IllegalStateException.class).hasMessage("No members available");
        verifyNoInteractions(tasks);
    }

    @Test void roundRobinCountersAreIndependentByProjectAndSafeForConcurrentCalls() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(6);
        try {
            List<Callable<User>> calls = IntStream.range(0, 300)
                    .mapToObj(i -> (Callable<User>) () -> roundRobin.assign(members, task)).toList();
            List<Future<User>> results = executor.invokeAll(calls, 10, TimeUnit.SECONDS);
            var counts = results.stream().map(result -> {
                try { return result.get(); }
                catch (Exception ex) { throw new AssertionError(ex); }
            }).collect(Collectors.groupingBy(User::getId, Collectors.counting()));
            assertThat(counts).hasSize(3);
            assertThat(counts.values()).containsOnly(100L);
            Task other = Task.builder().project(Project.builder().id(UUID.randomUUID()).build()).build();
            assertThat(roundRobin.assign(members, other)).isSameAs(members.get(0));
        } finally {
            executor.shutdownNow();
        }
    }
}
