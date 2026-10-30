# Assignment strategies

TaskAssignmentService selects workload or round-robin for each call, without mutable
shared strategy selection. Candidates come from the authorized project's workspace;
workload counts stay in that workspace. TaskService checks task/project consistency.
