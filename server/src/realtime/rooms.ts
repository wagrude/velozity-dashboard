export const ADMINS_ROOM = "admins";

export function userRoom(userId: number) {
  return `user:${userId}`;
}

export function projectRoom(projectId: number) {
  return `project:${projectId}`;
}
