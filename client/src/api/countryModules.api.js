import api from './axios.js';

export const countryModulesApi = {
  getGulfVisaBoard:    ()                   => api.get('/country-modules/gulf/visa-board'),
  getMalaysiaPlksBoard:()                   => api.get('/country-modules/malaysia/plks-board'),
  updateGulfVisa:      (candidateId, data)  => api.patch(`/country-modules/gulf/${candidateId}/visa`, data),
  updateMalaysiaPlks:  (candidateId, data)  => api.patch(`/country-modules/malaysia/${candidateId}/plks`, data)
};

export default countryModulesApi;
