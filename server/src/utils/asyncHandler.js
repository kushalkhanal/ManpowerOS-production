/**
 * asyncHandler — wraps async controller functions to catch errors
 * and forward them to the global error handler via next(err).
 *
 * Eliminates repetitive try/catch blocks in every controller.
 *
 * Usage:
 *   export const getPassports = asyncHandler(async (req, res) => {
 *     const data = await Passport.find(...);
 *     res.json(data);
 *   });
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
