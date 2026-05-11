# Adapter Pattern

MockExternalEmailClient has sendMessage() — incompatible with our EmailService interface.
EmailServiceAdapter implements EmailService and translates sendEmail() calls to sendMessage().
The rest of the app only knows about EmailService — the third-party API is completely hidden.
