# Task state machine

TaskStateMachine uses one immutable transition table rather than a GoF State
hierarchy with identical persistence methods:

| Current status | Allowed next statuses |
| --- | --- |
| TODO | IN_PROGRESS |
| IN_PROGRESS | IN_REVIEW, BLOCKED |
| BLOCKED | IN_PROGRESS |
| IN_REVIEW | DONE, IN_PROGRESS |
| DONE | None |

All other transitions, including same-status transitions, are rejected with the
existing exception. Starting TODO work requires completed dependencies. The existing
BLOCKED-to-IN_PROGRESS behavior is preserved. Undo checks the expected current
status and revalidates dependencies when restoring IN_PROGRESS. Commands continue
to use this component; service transactions and task row locks are unchanged.

This is a state machine, not a retained GoF State pattern.
