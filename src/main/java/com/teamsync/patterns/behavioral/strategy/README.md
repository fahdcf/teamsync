# Assignment strategies

TaskAssignmentService selects reused Spring-managed WorkloadStrategy or
RoundRobinStrategy instances with a simple switch. AssignmentStrategy accepts
candidates and a task, not a repository needed by only one algorithm.

WorkloadStrategy obtains IN_PROGRESS counts for all candidates in one grouped
TaskRepository query, scoped to the task's workspace. Missing counts mean zero;
ties keep the supplied candidate order, as before. RoundRobinStrategy has no
repository dependency and uses atomic per-project counters in a concurrent map.
TaskService still supplies workspace participants, includes the owner, checks
task/project consistency and holds the task row lock in its existing transaction.

Round-robin rotation is process-local, resets on restart, and is not coordinated
between backend instances. Its counter is not transactional: failed assignments
can consume a turn. Candidate order comes from the existing workspace collection;
membership changes can change the next candidate. Counters remain in memory for
projects seen by this process. No persistent scheduler or distributed lock is added.
