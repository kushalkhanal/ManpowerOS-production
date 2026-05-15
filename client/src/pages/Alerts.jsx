import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../context/AuthContext';
import CreateAlertModal from '../components/CreateAlertModal';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/PageState';
import { Bell, BellOff } from 'lucide-react';

const formatDueDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date();
  const daysLeft = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'Overdue';
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return 'Tomorrow';
  return `${daysLeft} days`;
};

const ALERT_TYPE_LABELS = {
  passport_expiring: 'Passport Expiring',
  medical_expiring: 'Medical Expiring',
  swukriti_expiring: 'Swukriti Expiring',
  demand_expiring: 'Demand Expiring',
  process_stalled: 'Process Stalled',
  medical_failed: 'Medical Failed',
  fee_outstanding: 'Outstanding Fee',
  orientation_missing: 'Orientation Missing',
  insurance_expiring: 'Insurance Expiring',
  dofe_license_expiring: 'DoFE License Expiring'
};

const Alerts = () => {
  const { alerts, loading, getAlerts, dismissAlert, dismissAll, resetDailyDismiss, error } = useAlerts();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    resetDailyDismiss();
    getAlerts();
  }, []);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const criticalAlerts = filteredAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = filteredAlerts.filter(a => a.severity === 'warning');
  const infoAlerts = filteredAlerts.filter(a => a.severity === 'info');

  const renderAlertGroup = (alertList, severity, title) => {
    if (alertList.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-3 ${
          severity === 'critical' ? 'text-red-700' :
          severity === 'warning' ? 'text-amber-700' : 'text-primary-700'
        }`}>
          {title} ({alertList.length})
        </h2>
        <div className="space-y-2">
          {alertList.map(alert => (
            <div key={alert.alertId} className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
              severity === 'critical' ? 'bg-red-50 border-red-500' :
              severity === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-primary-50 border-primary-500'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link to={alert.actionUrl} className="font-medium text-gray-900 hover:text-primary-600">
                    {alert.candidateName}
                  </Link>
                  {alert.candidatePhone && (
                    <span className="text-sm text-gray-500">{alert.candidatePhone}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    severity === 'critical' ? 'bg-red-100 text-red-800' :
                    severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-primary-100 text-primary-800'
                  }`}>
                    {ALERT_TYPE_LABELS[alert.type] || alert.type}
                  </span>
                  <span className="text-sm text-gray-600">{alert.message}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {alert.dueDate && (
                  <span className={`text-sm font-medium ${
                    formatDueDate(alert.dueDate) === 'Overdue' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formatDueDate(alert.dueDate)}
                  </span>
                )}
                <Link to={alert.actionUrl} className="text-sm px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">
                  View
                </Link>
                <button onClick={() => dismissAlert(alert.alertId)} className="text-gray-400 hover:text-gray-600 text-sm">
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              + Create Alert
            </button>
          )}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="all">All ({alerts.length})</option>
            <option value="critical">Critical ({criticalAlerts.length})</option>
            <option value="warning">Warning ({warningAlerts.length})</option>
            <option value="info">Info ({infoAlerts.length})</option>
          </select>
          <button onClick={dismissAll} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
            Dismiss All
          </button>
          <button onClick={() => getAlerts()} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
            Refresh
          </button>
        </div>
      </div>

      {loading && alerts.length === 0 ? (
        <div className="py-20">
          <LoadingState message="Checking for alerts..." />
        </div>
      ) : error ? (
        <div className="py-20">
          <ErrorState message={error} onRetry={getAlerts} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-20">
          <EmptyState 
            title="All clear!"
            subtitle="No active alerts or warnings at the moment"
            icon={<BellOff size={24} className="text-gray-400" />}
            action={
              <button onClick={() => getAlerts()} className="btn-secondary mt-2">
                Refresh
              </button>
            }
          />
        </div>
      ) : (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          {renderAlertGroup(criticalAlerts, 'critical', 'Critical')}
          {renderAlertGroup(warningAlerts, 'warning', 'Warning')}
          {renderAlertGroup(infoAlerts, 'info', 'Info')}
        </div>
      )}
      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Alerts;