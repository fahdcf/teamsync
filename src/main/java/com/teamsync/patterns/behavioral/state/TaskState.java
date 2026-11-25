package com.teamsync.patterns.behavioral.state;

import com.teamsync.entity.Task;
import com.teamsync.enums.TaskStatus;

/** Each constant is a reusable state object for a task's persisted status. */
enum TaskState {
    TODO {
        @Override void validateTransition(Task task, TaskStatus target) {
            if (target != TaskStatus.IN_PROGRESS) throw invalidTransition(task, target);
            if (hasUnfinishedDependencies(task)) {
                throw new IllegalStateException("Cannot start task: unfinished dependencies exist");
            }
        }
    },
    IN_PROGRESS {
        @Override void validateTransition(Task task, TaskStatus target) {
            if (target == TaskStatus.BLOCKED) return;
            if (target != TaskStatus.IN_REVIEW) throw invalidTransition(task, target);
            requireCompletedSubtasks(task, "send task to review");
        }
    },
    BLOCKED {
        @Override void validateTransition(Task task, TaskStatus target) {
            if (target != TaskStatus.IN_PROGRESS) throw invalidTransition(task, target);
        }
    },
    IN_REVIEW {
        @Override void validateTransition(Task task, TaskStatus target) {
            if (target == TaskStatus.IN_PROGRESS) return;
            if (target != TaskStatus.DONE) throw invalidTransition(task, target);
            requireCompletedSubtasks(task, "complete task");
        }
    },
    DONE {
        @Override void validateTransition(Task task, TaskStatus target) {
            throw invalidTransition(task, target);
        }
    };

    abstract void validateTransition(Task task, TaskStatus target);

    static boolean hasUnfinishedDependencies(Task task) {
        return task.getDependencies().stream().anyMatch(dependency -> dependency.getStatus() != TaskStatus.DONE);
    }

    private static void requireCompletedSubtasks(Task task, String action) {
        if (task.getSubtasks().stream().anyMatch(subtask -> !subtask.isCompleted())) {
            throw new IllegalStateException("Cannot " + action + ": complete all subtasks first");
        }
    }

    private static IllegalStateException invalidTransition(Task task, TaskStatus target) {
        return new IllegalStateException("Invalid transition: " + task.getStatus() + " → " + target);
    }
}
