# Proxy Pattern

TaskServiceProxy sits in front of TaskServiceImpl and controls access.
Before delete: checks the caller has ADMIN or PROJECT_MANAGER role.
Before assign: checks the caller is a project member.
If checks pass, it delegates to TaskServiceImpl. The controller never talks to the impl directly.
