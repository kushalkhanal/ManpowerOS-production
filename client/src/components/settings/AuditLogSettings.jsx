import { History } from 'lucide-react';

const AuditLogSettings = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
      <p className="text-sm text-gray-500 mt-1">View all system activity. Requires audit log permission.</p>
    </div>

    <div className="bg-white rounded-lg border p-8 text-center">
      <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-500 mb-2">Audit log feature coming soon.</p>
      <p className="text-sm text-gray-400">Will show all create, update, and delete operations with timestamps.</p>
    </div>
  </div>
);

export default AuditLogSettings;
