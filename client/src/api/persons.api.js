import api from './axios.js';

/**
 * Unified Person API — passport number is the primary key for the person.
 *
 * - POST /persons         combined intake (creates Passport + Candidate + SharedDocument)
 * - GET  /persons/search  searches by name (en/ne) + passport number
 * - GET  /persons/:id     unified profile blob (candidate + passport + docs + medical
 *                         + insurance + orientation + active demand)
 *
 * The duplicate-passport error returns 409 with:
 *   { error: 'passport_already_registered', message, existingCandidateId, existingFullName, existingStatus }
 */
export const personsApi = {
  create: (payload) => api.post('/persons', payload),
  search: (q, params = {}) => api.get('/persons/search', { params: { q, ...params } }),
  getProfile: (candidateId) => api.get(`/persons/${candidateId}`)
};

export default personsApi;
