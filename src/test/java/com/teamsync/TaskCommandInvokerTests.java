package com.teamsync;

import com.teamsync.patterns.behavioral.command.TaskCommand;
import com.teamsync.patterns.behavioral.command.TaskCommandInvoker;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class TaskCommandInvokerTests {
    @Test void rejectsHistoryChangesBetweenAuthorizationAndUndo() {
        var invoker = new TaskCommandInvoker();
        UUID user = UUID.randomUUID();
        TaskCommand old = mock(TaskCommand.class), newer = mock(TaskCommand.class);
        invoker.execute(user, old);
        invoker.execute(user, newer);
        assertThatThrownBy(() -> invoker.undo(user, old)).isInstanceOf(IllegalStateException.class);
        verify(old, never()).undo();
    }

    @Test void reservesUndoWithoutHoldingTheHistoryLockDuringDatabaseWork() throws Exception {
        var invoker = new TaskCommandInvoker();
        UUID user = UUID.randomUUID();
        TaskCommand command = mock(TaskCommand.class);
        CountDownLatch started = new CountDownLatch(1), release = new CountDownLatch(1);
        doAnswer(call -> { started.countDown(); assertThat(release.await(5, TimeUnit.SECONDS)).isTrue(); return null; }).when(command).undo();
        invoker.execute(user, command);
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Future<?> undo = executor.submit(() -> invoker.undo(user, command));
            assertThat(started.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(invoker.peek(user)).isSameAs(command);
            assertThatThrownBy(() -> invoker.undo(user, command)).isInstanceOf(IllegalStateException.class);
            release.countDown();
            undo.get(5, TimeUnit.SECONDS);
            verify(command, times(1)).undo();
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }
}
