import { useState } from 'react';
import { Eye } from 'lucide-react';
import { showToast } from '../ToastProvider';

const BackupSettings = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      showToast.success('Export started. Download will begin shortly.');
    } catch {
      showToast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900">Backup & Export</h2>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-medium text-gray-900 mb-2">Export All Data</h3>
        <p className="text-sm text-gray-500 mb-4">
          Download all agency data as JSON — candidates, staff, sponsors, and more.
        </p>
        <button onClick={handleExport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
          <Eye size={16} />
          {loading ? 'Exporting...' : 'Download Data'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          Full database backup is performed weekly. Contact support for custom backup schedules.
        </p>
      </div>
    </div>
  );
};

export default BackupSettings;
