/**
 * Single-user local deployment: no login. Returns a fixed operator identity
 * for audit trails or future use.
 */
export interface AuthUser {
  userId: string
  email: string
  role: string
}

const LOCAL_USER: AuthUser = {
  userId: 'local-user',
  email: 'local@eddiecrm.local',
  role: 'ADMIN',
}

export async function getAuthUser(): Promise<AuthUser> {
  return LOCAL_USER
}

export async function requireAuth(): Promise<AuthUser> {
  return LOCAL_USER
}
