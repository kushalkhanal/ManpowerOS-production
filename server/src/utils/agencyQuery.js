/**
 * agencyQuery — builds the base MongoDB filter scoped to the current agency.
 * Ensures every query is automatically multi-tenant safe.
 *
 * Usage:
 *   Model.find(forAgency(req))
 *   Model.find(forAgency(req, { isActive: true }))
 *   Model.findOne(forAgency(req, { _id: req.params.id }))
 */
export const forAgency = (req, extra = {}) => ({
  agencyId: req.user.agencyId,
  ...extra
});

export default forAgency;
