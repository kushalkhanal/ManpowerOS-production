/**
 * tenantHelper — Multi-tenancy utility for scoping MongoDB/Mongoose queries.
 *
 * This utility ensures that every database query includes the correct 'agencyId'
 * filter derived from the authenticated user's session.
 */

/**
 * scopeFilter — Injects agencyId into a query filter.
 * 
 * @param {Object} req - Express request object (must have req.user.agencyId)
 * @param {Object} baseFilter - The existing query filter
 * @returns {Object} The filter with agencyId injected
 * @throws {Error} if agencyId is missing and user is not superadmin
 */
export const scopeFilter = (req, baseFilter = {}) => {
  if (req.user.role === 'superadmin') {
    return baseFilter;
  }

  if (!req.user.agencyId) {
    throw new Error('Tenant context missing: user has no agencyId');
  }

  return {
    ...baseFilter,
    agencyId: req.user.agencyId
  };
};

/**
 * scopeData — Injects agencyId into a data object (for creates/saves).
 * 
 * @param {Object} req - Express request object
 * @param {Object} data - The data to be saved
 * @returns {Object} The data with agencyId injected
 */
export const scopeData = (req, data = {}) => {
  if (!req.user.agencyId) {
    throw new Error('Tenant context missing: user has no agencyId');
  }

  return {
    ...data,
    agencyId: req.user.agencyId
  };
};

export default {
  scopeFilter,
  scopeData
};
