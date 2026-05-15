/**
 * PageState — reusable loading, error, and empty state components.
 *
 * Usage:
 *   if (loading) return <LoadingState />;
 *   if (error)   return <ErrorState message={error} onRetry={reload} />;
 *   if (!data.length) return <EmptyState title="No candidates" subtitle="Add your first candidate" />;
 */

// ─── Loading ──────────────────────────────────────────────────────────────────

export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
    </div>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

// ─── Error ────────────────────────────────────────────────────────────────────

export const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center px-4">
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-900">Error loading data</p>
      <p className="text-sm text-gray-500 mt-1">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
      >
        Try again
      </button>
    )}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

export const EmptyState = ({ title = 'No data', subtitle, action, icon }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center px-4">
    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
      {icon ?? (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="mt-1">{action}</div>}
  </div>
);

export default { LoadingState, ErrorState, EmptyState };
