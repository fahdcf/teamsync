# Undo commands

Assignment, status and deletion commands retain the last ten committed actions per
user in memory. TaskService.undo checks current resource permissions and restored
assignee eligibility before replay. Assignment/status undo reloads the current row
and changes only the affected field. Delete undo restores snapshots with new IDs.
History changes after commit; failed transactions do not produce undoable actions.
History is lost on restart and is intended for a single backend instance.
