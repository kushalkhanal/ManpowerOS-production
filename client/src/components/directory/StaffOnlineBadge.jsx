import { useState, useEffect } from 'react';
import { devError } from '../../utils/devLog';

const StaffOnlineBadge = ({ userId }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkOnline = async () => {
      try {
        const response = await fetch('/api/staff/online', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setIsOnline(data.includes(userId));
      } catch (err) {
        devError('Failed to check online status:', err);
      }
    };

    checkOnline();
    const interval = setInterval(checkOnline, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!isOnline) return null;

  return (
    <span className="inline-flex items-center gap-1 text-green-600 text-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      Online
    </span>
  );
};

export default StaffOnlineBadge;