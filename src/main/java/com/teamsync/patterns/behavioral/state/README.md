# Task State

`TaskStateMachine` delegates transition validation to the `TaskState` that
matches the persisted status. The state checks dependencies when starting and
subtask completion before review or completion. Task services and the status
command save the resulting state. Undo keeps its existing restoration rules.
