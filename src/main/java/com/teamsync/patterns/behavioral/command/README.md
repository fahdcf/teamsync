# Command Pattern

Each action (delete, assign, change status) is wrapped in a Command object with execute() and undo().
TaskCommandInvoker keeps a per-user history stack.
Calling POST /tasks/undo pops the last command and calls undo() — no action-specific logic in the controller.
