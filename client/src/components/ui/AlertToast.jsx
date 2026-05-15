import { Link } from 'react-router-dom';

const AlertToast = ({ alert, onDismiss }) => {
  const getIcon = () => {
    if (alert.priority === 'urgent') return '🚨';
    if (alert.alertType === 'deadline') return '⏰';
    if (alert.alertType === 'info') return 'ℹ️';
    return '📢';
  };

  const getIconStyle = () => {
    if (alert.priority === 'urgent') return 'text-red-500';
    if (alert.alertType === 'deadline') return 'text-amber-500';
    return 'text-primary-500';
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', maxWidth: '340px' }}>
      <div style={{ fontSize: '20px', flexShrink: 0 }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: '600', margin: 0, fontSize: '14px', color: '#111' }}>
          {alert.title}
        </p>
        <p style={{ margin: '4px 0', fontSize: '13px', color: '#4B5563' }}>
          {alert.message}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
          From: {alert.from}
        </p>
        {alert.actionUrl && (
          <Link
            to={alert.actionUrl}
            style={{ fontSize: '12px', color: '#059669', marginTop: '4px', display: 'inline-block' }}
          >
            View details →
          </Link>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#9CA3AF',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default AlertToast;