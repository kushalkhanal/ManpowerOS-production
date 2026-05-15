import { Download, X, Users } from 'lucide-react';

/**
 * Sticky bottom action bar shown when one or more rows are selected.
 * Lives at the bottom of the CandidateList page.
 */
const BulkSelectBar = ({ count, onClear, onExport }) => {
  if (!count) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 pt-2 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-blue-50 rounded-lg flex-shrink-0">
            <Users size={14} className="text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {count} candidate{count === 1 ? '' : 's'} selected
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={12} /> Clear
          </button>
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkSelectBar;
