import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, CheckCheck, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';

const TYPE_LABELS = {
  passport_expiring:    'Passport Expiring',
  medical_expiring:     'Medical Expiring',
  swukriti_expiring:    'Swukriti Expiring',
  demand_expiring:      'Demand Expiring',
  process_stalled:      'Process Stalled',
  medical_failed:       'Medical Failed',
  fee_outstanding:      'Outstanding Fee',
  orientation_missing:  'Orientation Missing',
  insurance_expiring:   'Insurance Expiring',
  dofe_license_expiring:'DoFE License',
  manual:               'Notice',
};

const SeverityIcon = ({ severity }) => {
  if (severity === 'critical') return <AlertCircle size={14} className="text-red-500 shrink-0" />;
  if (severity === 'warning')  return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
  return <Info size={14} className="text-blue-500 shrink-0" />;
};

const formatDue = (date) => {
  if (!date) return null;
  const days = Math.ceil((new Date(date) - new Date()) / 86400000);
  if (days < 0)  return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
};

export default function NotificationBell() {
  const { alerts, counts, loading, getAlerts, getCounts, dismissAlert, dismissAll } = useAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    getAlerts();
    getCounts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (!open) getAlerts();
    setOpen(prev => !prev);
  };

  const handleDismiss = (e, alertId) => {
    e.preventDefault();
    e.stopPropagation();
    dismissAlert(alertId);
  };

  const handleMarkAllRead = () => {
    dismissAll();
    setOpen(false);
  };

  const badgeCount = counts.critical + counts.warning;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 flex flex-col max-h-[520px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {counts.total > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {counts.total}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          {/* Count chips */}
          {counts.total > 0 && (
            <div className="flex gap-2 px-4 py-2 border-b border-gray-50">
              {counts.critical > 0 && (
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {counts.critical} Critical
                </span>
              )}
              {counts.warning > 0 && (
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {counts.warning} Warning
                </span>
              )}
              {counts.info > 0 && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {counts.info} Info
                </span>
              )}
            </div>
          )}

          {/* Alert list */}
          <div className="overflow-y-auto flex-1">
            {loading && alerts.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Loading...</div>
            ) : alerts.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">All clear — no active alerts</p>
              </div>
            ) : (
              alerts.map(alert => (
                <Link
                  key={alert.alertId}
                  to={alert.actionUrl}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 group transition-colors"
                >
                  <div className="mt-0.5">
                    <SeverityIcon severity={alert.severity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {alert.candidateName && (
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.candidateName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        alert.severity === 'critical' ? 'bg-red-50 text-red-700' :
                        alert.severity === 'warning'  ? 'bg-amber-50 text-amber-700' :
                                                        'bg-blue-50 text-blue-700'
                      }`}>
                        {TYPE_LABELS[alert.type] || alert.type}
                      </span>
                      {alert.dueDate && (
                        <span className={`text-[10px] font-medium ${
                          formatDue(alert.dueDate) === 'Overdue' ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {formatDue(alert.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(e, alert.alertId)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-gray-500 transition-all shrink-0"
                    aria-label="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between bg-gray-50 rounded-b-xl">
            <Link
              to="/alerts"
              onClick={() => setOpen(false)}
              className="text-xs text-primary font-medium hover:underline"
            >
              View all alerts
            </Link>
            {alerts.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <CheckCheck size={13} />
                Mark all as read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
