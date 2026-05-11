# Prototype Pattern

TaskTemplate implements cloneTask() to produce a deep copy of itself.
Instead of constructing a new task from scratch, callers clone a template.
This avoids re-specifying title, description, priority, and due date every time.
