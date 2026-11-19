package com.teamsync;

import com.teamsync.entity.Notification;
import com.teamsync.entity.User;
import com.teamsync.enums.NotificationType;
import com.teamsync.repository.NotificationRepository;
import com.teamsync.service.NotificationService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceTests {
    @ParameterizedTest @EnumSource(NotificationType.class)
    void persistsBothStoredTypesWithoutPretendingToDeliverEmail(NotificationType type) {
        NotificationRepository notifications = mock(NotificationRepository.class);
        User recipient = new User();
        new NotificationService(notifications).notify(recipient, "Stored notification", type);
        ArgumentCaptor<Notification> stored = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(stored.capture());
        assertThat(stored.getValue().getType()).isEqualTo(type);
        assertThat(stored.getValue().getRecipient()).isSameAs(recipient);
        assertThat(stored.getValue().getMessage()).isEqualTo("Stored notification");
        assertThat(stored.getValue().isReadStatus()).isFalse();
        verifyNoMoreInteractions(notifications);
    }
}
