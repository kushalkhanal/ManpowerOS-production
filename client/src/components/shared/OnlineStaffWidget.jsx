import { useState, useEffect } from 'react';
import { staffApi } from '../api/staff.api.js';

const OnlineStaffWidget = () => {
  const [onlineStaff, setOnlineStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineStaff = async () => {
      try {
        const res = await staffApi.getOnline();
        setOnlineStaff(res.data || []);
      } catch (error) {
        console.error('Failed to fetch online staff:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineStaff();

    const handleStaffOnline = (e) => {
      setOnlineStaff(prev => [...prev, e.detail]);
    };

    const handleStaffOffline = (e) => {
      setOnlineStaff(prev => prev.filter(s => s.userId !== e.detail.userId));
    };

    window.addEventListener('staff-online', handleStaffOnline);
    window.addEventListener('staff-offline', handleStaffOffline);

    const interval = setInterval(fetchOnlineStaff, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('staff-online', handleStaffOnline);
      window.removeEventListener('staff-offline', handleStaffOffline);
    };
  }, []);

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      manager: 'bg-teal-100 text-teal-700',
      staff: 'bg-amber-100 text-amber-700',
      documentation: 'bg-primary-100 text-primary-700',
      agent: 'bg-green-100 text-green-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Staff Online</h3>
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          {onlineStaff.length} online
        </span>
      </div>

      {onlineStaff.length === 0 ? (
        <p className="text-sm text-gray-500">No staff currently online</p>
      ) : (
        <div className="space-y-2">
          {onlineStaff.map(staff => (
            <div key={staff.userId} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700 flex-1">{staff.name}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadge(staff.role)}`}>
                {staff.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnlineStaffWidget;