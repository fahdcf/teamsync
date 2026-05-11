# Observer Pattern

ProjectEventPublisher maintains a list of ProjectEventListeners.
When a task changes status, the publisher calls onEvent() on all listeners.
Listeners (ActivityLogListener, NotificationListener) react independently.
The publisher knows nothing about what listeners do — fully decoupled.
