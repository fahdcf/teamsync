# Task templates

TaskTemplate is a persistence entity in entity/. Its repository lives in repository/
and its authorized workflow in service/TaskTemplateService. cloneTask copies template
values; creating a task still goes through TaskService's validation and permissions.
Source and destination must belong to the same project.
