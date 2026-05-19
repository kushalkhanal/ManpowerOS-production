import { PERMISSIONS_LIST, STAFF_DEFAULT_PERMISSIONS, ROLE_LABELS } from '../../constants/roles';

const ROLES_TO_SHOW = ['admin', 'manager', 'staff', 'documentation', 'agent'];

const PermissionSettings = () => (
  <div className="space-y-6 max-w-3xl">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Role Permissions</h2>
      <p className="text-sm text-gray-500 mt-1">Default permissions assigned to each role. Customize per-staff in Staff settings.</p>
    </div>

    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
            {ROLES_TO_SHOW.map(role => (
              <th key={role} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {ROLE_LABELS[role]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {PERMISSIONS_LIST.map(perm => (
            <tr key={perm.key}>
              <td className="px-4 py-3 text-sm text-gray-900">{perm.label}</td>
              {ROLES_TO_SHOW.map(role => (
                <td key={role} className="px-4 py-3">
                  {STAFF_DEFAULT_PERMISSIONS[role]?.[perm.key] ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default PermissionSettings;
