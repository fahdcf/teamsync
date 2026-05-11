# Strategy Pattern

AssignmentStrategy defines the algorithm interface. WorkloadStrategy and RoundRobinStrategy
are interchangeable implementations. TaskAssignmentService runs whichever strategy is injected,
with no if/else logic in the service itself.
