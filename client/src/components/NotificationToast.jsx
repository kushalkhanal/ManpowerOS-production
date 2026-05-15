import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, CheckSquare, Clock, User, X } from 'lucide-react';

const ICONS = {
  alert:    { Icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50' },
  task:     { Icon: CheckSquare,   color: 'text-blue-500',   bg: 'bg-blue-50' },
  expiry:   { Icon: Clock,         color: 'text-orange-500', bg: 'bg-orange-50' },
  update:   { Icon: User,          color: 'text-green-500',  bg: 'bg-green-50' },
  default:  { Icon: Bell,          color: 'text-gray-500',   bg: 'bg-gray-50' }
};

function Toast({ toast, onClose }) {
  const { Icon, color, bg } = ICONS[toast.type] || ICONS.default;

  return (
    <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 w-80 animate-slide-in-right">
      <div className={`p-1.5 rounded-lg shrink-0 ${bg}`}>
        <Icon size={16} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-medium text-gray-900 truncate">{toast.title}</p>}
        <p className="text-xs text-gray-500 line-clamp-2">{toast.message}</p>
        {toast.href && (
          <Link to={toast.href} onClick={onClose} className="text-xs text-primary hover:underline mt-0.5 block">
            View →
          </Link>
        )}
      </div>
      <button onClick={onClose} className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

let toastIdCounter = 0;

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastIdCounter;
    setToasts(prev => [{ id, ...toast }, ...prev].slice(0, 4));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const onAlert = (e) => addToast({
      type: 'alert',
      title: 'New Alert',
      message: e.detail?.message || e.detail?.title || 'A new alert was triggered',
      href: '/alerts'
    });

    const onTaskAssigned = (e) => addToast({
      type: 'task',
      title: 'Task Assigned',
      message: e.detail?.title || 'A task was assigned to you',
      href: '/tasks'
    });

    const onTaskOverdue = (e) => addToast({
      type: 'task',
      title: 'Task Overdue',
      message: e.detail?.title || 'A task is now overdue',
      href: '/tasks'
    });

    const onExpiry = (e) => addToast({
      type: 'expiry',
      title: 'Document Expiring',
      message: e.detail?.message || 'A document is expiring soon',
      href: '/alerts'
    });

    const onCandidateUpdate = (e) => {
      if (!e.detail?.candidateName) return;
      addToast({
        type: 'update',
        title: 'Status Updated',
        message: `${e.detail.candidateName}: ${e.detail.newStatus || ''}`,
        href: e.detail.candidateId ? `/candidates/${e.detail.candidateId}` : '/candidates'
      });
    };

    window.addEventListener('new-alert',        onAlert);
    window.addEventListener('task-assigned',     onTaskAssigned);
    window.addEventListener('task-overdue',      onTaskOverdue);
    window.addEventListener('expiry-alert',      onExpiry);
    window.addEventListener('candidate-update',  onCandidateUpdate);

    return () => {
      window.removeEventListener('new-alert',        onAlert);
      window.removeEventListener('task-assigned',     onTaskAssigned);
      window.removeEventListener('task-overdue',      onTaskOverdue);
      window.removeEventListener('expiry-alert',      onExpiry);
      window.removeEventListener('candidate-update',  onCandidateUpdate);
    };
  }, [addToast]);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
