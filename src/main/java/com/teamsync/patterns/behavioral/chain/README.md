# Chain of Responsibility Pattern

Each validator handles one rule. If the rule passes, it calls the next validator.
If it fails, it throws a ValidationException immediately.
The chain is assembled by ValidationChainFactory: Title → Deadline → Assignee → Priority.
TaskService passes the request to the first validator and lets the chain handle the rest.
