/**
 * paginate — extracts and validates pagination params from req.query.
 *
 * Usage:
 *   const { page, limit, skip } = paginate(req.query);
 *   const docs = await Model.find(filter).skip(skip).limit(limit);
 *   res.json(paginatedResponse(docs, total, page, limit));
 */
export const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * paginatedResponse — builds the standard paginated response shape.
 */
export const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  }
});

export default { paginate, paginatedResponse };
