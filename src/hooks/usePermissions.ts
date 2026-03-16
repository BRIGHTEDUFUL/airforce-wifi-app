import { useAuth } from './useAuth';

export type Role = 'Administrator' | 'Operator' | 'Viewer';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  return {
    role,
    isAdmin: role === 'Administrator',
    isOperator: role === 'Operator',
    isViewer: role === 'Viewer',
    // What each role can do
    canCreate: role === 'Administrator' || role === 'Operator',
    canEdit: role === 'Administrator' || role === 'Operator',
    canDelete: role === 'Administrator',
    canViewPasswords: role === 'Administrator' || role === 'Operator',
    canManageUsers: role === 'Administrator',
    canViewAudit: role === 'Administrator',
  };
}
