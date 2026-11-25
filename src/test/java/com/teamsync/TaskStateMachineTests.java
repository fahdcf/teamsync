package com.teamsync;

import com.teamsync.entity.Task;
import com.teamsync.entity.Subtask;
import com.teamsync.enums.TaskStatus;
import com.teamsync.patterns.behavioral.state.TaskStateMachine;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Set;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;

class TaskStateMachineTests {
    private final TaskStateMachine machine = new TaskStateMachine();

    static Stream<Object[]> transitions() {
        return Stream.of(TaskStatus.values()).flatMap(from -> Stream.of(TaskStatus.values())
                .map(to -> new Object[]{from, to}));
    }

    @ParameterizedTest @MethodSource("transitions")
    void preservesEveryAllowedAndForbiddenTransition(TaskStatus from, TaskStatus to) {
        Set<String> allowed = Set.of("TODO:IN_PROGRESS", "IN_PROGRESS:IN_REVIEW", "IN_PROGRESS:BLOCKED",
                "BLOCKED:IN_PROGRESS", "IN_REVIEW:DONE", "IN_REVIEW:IN_PROGRESS");
        Task task = Task.builder().status(from).build();
        if (allowed.contains(from+":"+to)) {
            machine.transition(task, to);
            assertThat(task.getStatus()).isEqualTo(to);
        } else {
            assertThatThrownBy(() -> machine.transition(task, to))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Invalid transition: " + from + " → " + to);
            assertThat(task.getStatus()).isEqualTo(from);
        }
    }

    @Test void dependenciesBlockStartingButDoNotChangeOtherTransitionRules() {
        Task dependency = Task.builder().status(TaskStatus.IN_PROGRESS).build();
        Task task = Task.builder().status(TaskStatus.TODO).dependencies(Set.of(dependency)).build();
        assertThatThrownBy(() -> machine.transition(task, TaskStatus.IN_PROGRESS))
                .isInstanceOf(IllegalStateException.class).hasMessage("Cannot start task: unfinished dependencies exist");
        dependency.setStatus(TaskStatus.DONE);
        machine.transition(task, TaskStatus.IN_PROGRESS);
        machine.transition(task, TaskStatus.BLOCKED);
        dependency.setStatus(TaskStatus.TODO);
        machine.transition(task, TaskStatus.IN_PROGRESS);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test void undoStillChecksCurrentStatusAndDependencies() {
        Task dependency = Task.builder().status(TaskStatus.TODO).build();
        Task task = Task.builder().status(TaskStatus.IN_REVIEW).dependencies(Set.of(dependency)).build();
        assertThatThrownBy(() -> machine.undoTransition(task, TaskStatus.DONE, TaskStatus.IN_PROGRESS))
                .isInstanceOf(IllegalStateException.class).hasMessage("Task status changed since this action");
        assertThatThrownBy(() -> machine.undoTransition(task, TaskStatus.IN_REVIEW, TaskStatus.IN_PROGRESS))
                .isInstanceOf(IllegalStateException.class).hasMessage("Cannot restore task: unfinished dependencies exist");
        dependency.setStatus(TaskStatus.DONE);
        machine.undoTransition(task, TaskStatus.IN_REVIEW, TaskStatus.IN_PROGRESS);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test void nullTargetRemainsAnInvalidTransition() {
        Task task = Task.builder().status(TaskStatus.TODO).build();
        assertThatThrownBy(() -> machine.transition(task, null))
                .isInstanceOf(IllegalStateException.class).hasMessage("Invalid transition: TODO → null");
    }

    @Test void reviewAndCompletionCheckTheCurrentSubtaskChecklist() {
        Subtask checklistItem = Subtask.builder().title("Test the change").build();
        Task task = Task.builder().status(TaskStatus.IN_PROGRESS).subtasks(List.of(checklistItem)).build();
        assertThatThrownBy(() -> machine.transition(task, TaskStatus.IN_REVIEW))
                .hasMessage("Cannot send task to review: complete all subtasks first");
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);

        checklistItem.setCompleted(true);
        machine.transition(task, TaskStatus.IN_REVIEW);
        checklistItem.setCompleted(false);
        assertThatThrownBy(() -> machine.transition(task, TaskStatus.DONE))
                .hasMessage("Cannot complete task: complete all subtasks first");
        machine.transition(task, TaskStatus.IN_PROGRESS);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }
}
