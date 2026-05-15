const PAGE_SIZES = [10, 20, 50];

const Pagination = ({
  page = 1,
  pages = 1,
  total = 0,
  pageSize = 20,
  pageSizeOptions = PAGE_SIZES,
  onPageChange,
  onPageSizeChange
}) => {
  if (!total) return null;

  return (
    <div className="mt-4 flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="page-size" className="text-sm text-gray-600">Rows:</label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          Page {page} of {pages}{total ? ` (${total} total)` : ''}
        </span>
        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
