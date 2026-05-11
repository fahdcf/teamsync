# Factory Method Pattern

NotificationFactory defines createNotification() as abstract.
InAppNotificationFactory and EmailNotificationFactory each implement it differently.
The caller uses notifyUser() on the factory — never calls new Notification() directly.
