# Notifications through Spring events

Transactional task/comment services publish ProjectEvent using Spring
ApplicationEventPublisher. Its recipient is the notification target, not the actor.
Assignment and status notifications go to the assignee. Comments notify a different
assignee once, using the existing comment message; authors do not notify themselves.
Unassigned status changes, task creation and project updates have no notification
consumer and publish no event. Reply behavior is unchanged.

NotificationListener uses synchronous @EventListener, and NotificationService joins
the publisher's transaction. Notifications roll back with failed task/comment
changes. There is no external delivery to defer until after commit, so after-commit
processing and a second transaction would add complexity and change atomicity.
Defensive handling of an event with no recipient has no persistence effect.

The integration tests cover both an immediate listener authentication failure and
a database error deferred until the outer transaction commits. Both roll back
notifications, task changes and audit writes, and neither publishes undo history.
Returning from event dispatch does not establish that the transaction committed.

Services continue to write audit records directly with authenticated actors and
actual resource IDs. No duplicate audit listener or custom event infrastructure is
introduced. NotificationService stores both existing notification types, but does
not send or claim to send email.
