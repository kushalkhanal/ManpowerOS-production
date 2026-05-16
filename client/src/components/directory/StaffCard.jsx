import { useAuth } from '../../context/AuthContext';

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-teal-100 text-teal-800',
  staff: 'bg-amber-100 text-amber-800',
  documentation: 'bg-primary-100 text-primary-800',
  agent: 'bg-green-100 text-green-800'
};

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  documentation: 'Documentation',
  agent: 'Agent'
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const StaffCard = ({ staff, onEdit, onResetPassword, onToggle, onDelete }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const getAvatarColor = (role) => {
    const colors = {
      admin: 'bg-red-500',
      manager: 'bg-teal-500',
      staff: 'bg-amber-500',
      documentation: 'bg-primary-500',
      agent: 'bg-green-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  const formatJoinDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-start gap-3">
        {staff.photo ? (
          <img
            src={staff.photo}
            alt={staff.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(staff.role)}`}>
            {getInitials(staff.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{staff.name}</h3>
          <p className="text-sm text-gray-600">{staff.department || ROLE_LABELS[staff.role]}</p>
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${ROLE_COLORS[staff.role] || 'bg-gray-100'}`}>
            {ROLE_LABELS[staff.role] || staff.role}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        {staff.phone && <p>Phone: {staff.phone}</p>}
        {staff.joiningDate && (
          <p>Joined: {formatJoinDate(staff.joiningDate)}</p>
        )}
      </div>

      <div className="mt-3 flex gap-3 text-sm">
        <div className="bg-gray-50 rounded px-3 py-1">
          <span className="font-semibold text-gray-900">{staff.candidatesAssigned || 0}</span>
          <span className="text-gray-500 ml-1">cases</span>
        </div>
        <div className="bg-gray-50 rounded px-3 py-1">
          <span className="font-semibold text-gray-900">{staff.sponsorsIntroduced || 0}</span>
          <span className="text-gray-500 ml-1">sponsors</span>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-3 pt-3 border-t flex gap-2">
          <button
            onClick={() => onEdit?.(staff)}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={() => onResetPassword?.(staff._id)}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset Pass
          </button>
          <button
            onClick={() => onToggle?.(staff._id)}
            className={`flex-1 px-2 py-1.5 text-xs rounded ${staff.isActive !== false ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'}`}
          >
            {staff.isActive !== false ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete?.(staff._id)}
            className="px-2 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffCard;