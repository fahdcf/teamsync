# State Pattern

Each TaskStatus has a corresponding State class that knows which transitions are valid.
TaskStateMachine holds no transition logic itself — it delegates to the current state.
Example: InProgressState allows going to IN_REVIEW or BLOCKED, but not directly to DONE.
