# Singleton Pattern

Ensures only one instance of AppLogger exists in the application.
AppLogger uses a private constructor and a static getInstance() method.
All services call AppLogger.getInstance().info(...) to log — never create a new logger.
