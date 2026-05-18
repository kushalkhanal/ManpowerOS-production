/**
 * Cursor-based pagination utilities.
 *
 * Cursor format: "<createdAt_iso>__<_id>"
 * This gives stable ordering even when new records are inserted between pages.
 *
 * Usage (in a controller):
 *
 *   const { filter, limitNumber } = buildCursorFilter(req.query, baseFilter);
 *   const results = await Model.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limitNumber + 1);
 *   return res.json(buildCursorPage(results, limitNumber, total));
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse and cap the limit query param.
 */
export const parseLimit = (rawLimit, defaultLimit = DEFAULT_LIMIT) => {
  const parsed = Number.parseInt(rawLimit, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(parsed, MAX_LIMIT)
    : defaultLimit;
};

/**
 * Inject cursor condition into an existing Mongoose filter.
 * Returns the modified filter and the parsed limit.
 *
 * @param {Object} query         - req.query (expects .cursor and .limit)
 * @param {Object} filter        - existing Mongoose filter (mutated in place)
 * @param {string} [dateField]   - document date field used as cursor anchor (default: 'createdAt')
 * @returns {{ filter, limitNumber, hasCursor }}
 */
export const buildCursorFilter = (
  query,
  filter = {},
  dateField = "createdAt",
) => {
  const limitNumber = parseLimit(query.limit);
  const { cursor } = query;

  if (cursor) {
    const [cursorDate, cursorId] = cursor.split("__");
    const cursorCondition = {
      $or: [
        { [dateField]: { $lt: new Date(cursorDate) } },
        { [dateField]: new Date(cursorDate), _id: { $lt: cursorId } },
      ],
    };
    filter.$and = filter.$and
      ? [...filter.$and, cursorCondition]
      : [cursorCondition];
  }

  return { filter, limitNumber, hasCursor: !!cursor };
};

/**
 * Encode a Mongoose document into a cursor string.
 * @param {Object} doc
 * @param {string} [dateField] - document date field to encode (default: 'createdAt')
 */
export const encodeCursor = (doc, dateField = "createdAt") =>
  doc ? `${new Date(doc[dateField]).toISOString()}__${doc._id}` : null;

/**
 * Slice results, detect hasMore, and build the cursor response shape.
 *
 * @param {Array}  results     - Query results with limitNumber + 1 fetched
 * @param {number} limitNumber - Page size
 * @param {number} [total]     - Total count (only available on first page)
 * @param {string} [dateField] - Document date field used as cursor anchor
 * @returns {{ data, nextCursor, hasMore, total? }}
 */
export const buildCursorPage = (
  results,
  limitNumber,
  total,
  dateField = "createdAt",
) => {
  const hasMore = results.length > limitNumber;
  const page = results.slice(0, limitNumber);
  const nextCursor = hasMore
    ? encodeCursor(page[page.length - 1], dateField)
    : null;

  return {
    data: page,
    nextCursor,
    hasMore,
    ...(total !== undefined && { total }),
  };
};
