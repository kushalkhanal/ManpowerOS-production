import { useState, useEffect } from 'react';
import { candidatesApi } from '../api';
import { devError } from '../utils/devLog';
import { fmtDateTimeUS } from '../utils/format';
import { ACTIVITY_COLUMN_LABELS } from '../constants/activityLog';

const ACTION_BADGE = {
  created:        { bg: 'bg-blue-100',   text: 'text-blue-800' },
  updated:        { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  file_uploaded:  { bg: 'bg-purple-100', text: 'text-purple-800' },
  status_changed: { bg: 'bg-green-100',  text: 'text-green-800' },
  marked_complete:{ bg: 'bg-green-100',  text: 'text-green-800' },
  deleted:        { bg: 'bg-red-100',    text: 'text-red-800' },
};

const ActivityLogModal = ({ isOpen, onClose, candidateId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    if (isOpen && candidateId) loadLogs();
  }, [isOpen, candidateId, filter]);

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter !== 'all') params.columnId = filter;
      const response = await candidatesApi.getActivityLogs(candidateId, params);
      setLogs(response.data.data || []);
      setPagination({ page: response.data.page, pages: response.data.pages, total: response.data.total });
    } catch (err) {
      devError('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Activity Log</h3>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Activities</option>
                {Object.entries(ACTIVITY_COLUMN_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No activity logs found</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {logs.map((log, idx) => {
                  const badge = ACTION_BADGE[log.action] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
                  return (
                    <div key={idx} className="border rounded p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{log.performerName}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${badge.bg} ${badge.text}`}>
                              {log.action.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {ACTIVITY_COLUMN_LABELS[log.columnId] ?? log.columnId} - {log.details}
                          </p>
                          {log.fileUrl && (
                            <a
                              href={log.fileUrl.startsWith('http') ? log.fileUrl : `http://localhost:5000${log.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-800 underline"
                            >
                              View File
                            </a>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{fmtDateTimeUS(log.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => loadLogs(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                <span className="px-3 py-1">Page {pagination.page} of {pagination.pages}</span>
                <button onClick={() => loadLogs(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button onClick={onClose} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 sm:ml-3 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogModal;
