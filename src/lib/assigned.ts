export type AssignedItemRow = {
  id: string;
  key: string;
  title: string;
  status: string;
  assignee_id: string | null;
};

/**
 * Items assigned to the signed-in user. Done items stay in the list: the dashboard
 * reports everything assigned to you, not just open work.
 */
export function assignedItems<T extends AssignedItemRow>(items: T[], profileId: string): T[] {
  return items.filter((item) => item.assignee_id === profileId);
}
