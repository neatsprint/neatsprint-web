export type AssignedItemRow = {
  id: string;
  key: string;
  title: string;
  status: string;
  assignee_id: string | null;
};

/** Active work first, finished work last; anything unknown sorts after the known statuses. */
const STATUS_ORDER: Record<string, number> = {
  IN_PROGRESS: 0,
  TODO: 1,
  IN_REVIEW: 2,
  BLOCKED: 3,
  DONE: 4,
};

export function statusOrder(status: string): number {
  return STATUS_ORDER[status] ?? 5;
}

/**
 * Items assigned to the signed-in user. Done items stay in the list: the dashboard
 * reports everything assigned to you, not just open work. Rows are ordered by status
 * (in progress, to do, in review, blocked, done) and keep their backlog order within
 * a status.
 */
export function assignedItems<T extends AssignedItemRow>(items: T[], profileId: string): T[] {
  return items
    .filter((item) => item.assignee_id === profileId)
    .sort((a, b) => statusOrder(a.status) - statusOrder(b.status));
}
