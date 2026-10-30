# Notifications through Spring events

Transactional services publish ProjectEvent using Spring ApplicationEventPublisher.
NotificationListener receives events with @EventListener. Audit records are written
by services with real resource IDs; the old duplicate activity listener and custom
publisher/listener framework have been removed.
