# Decorator Pattern

NotificationSender is the base interface. InAppSender is the plain implementation.
EmailDecorator wraps any sender and adds email sending on top.
UrgentDecorator wraps any sender and prepends [URGENT] to the message.
They can be stacked: UrgentDecorator(EmailDecorator(InAppSender)) sends urgent + email + in-app.
