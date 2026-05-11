# Facade Pattern

ProjectManagementFacade provides a single method to initialize a project.
Without the facade, callers would need to: find workspace, create project, find user, assign manager.
The facade hides this complexity behind one initializeProject() call.
