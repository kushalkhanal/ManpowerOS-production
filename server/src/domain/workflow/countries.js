/**
 * Countries — domain value objects for destination countries supported in v1.
 *
 * v1 supports two regions: Gulf (KSA, UAE, Qatar, Kuwait, Bahrain, Oman) and
 * Malaysia. Other destinations (Korea EPS, Japan SSW, Israel, Europe) are
 * deferred to v2.
 *
 * Pure domain module — no Mongoose, no Express, no I/O.
 */

export const REGION = Object.freeze({
  GULF: 'gulf',
  MALAYSIA: 'malaysia',
  OTHER: 'other'
});

export const COUNTRY = Object.freeze({
  SAUDI_ARABIA: 'Saudi Arabia',
  UAE: 'UAE',
  QATAR: 'Qatar',
  KUWAIT: 'Kuwait',
  BAHRAIN: 'Bahrain',
  OMAN: 'Oman',
  MALAYSIA: 'Malaysia'
});

const COUNTRY_TO_REGION = {
  [COUNTRY.SAUDI_ARABIA]: REGION.GULF,
  [COUNTRY.UAE]: REGION.GULF,
  [COUNTRY.QATAR]: REGION.GULF,
  [COUNTRY.KUWAIT]: REGION.GULF,
  [COUNTRY.BAHRAIN]: REGION.GULF,
  [COUNTRY.OMAN]: REGION.GULF,
  [COUNTRY.MALAYSIA]: REGION.MALAYSIA
};

const REGION_METADATA = {
  [REGION.GULF]: {
    medicalSystem: 'GAMCA_WAFID',
    medicalLabel: 'GAMCA / Wafid',
    visaSystem: 'EMBASSY_STAMPING',
    visaLabel: 'Calling Visa + Embassy Stamping',
    requiresEmbassyAttestation: true,
    requiresPLKS: false,
    requiresFOMEMA: false,
    requiresVLN: false
  },
  [REGION.MALAYSIA]: {
    medicalSystem: 'FOMEMA_BESTINET',
    medicalLabel: 'FOMEMA / Bestinet',
    visaSystem: 'VLN_PLKS',
    visaLabel: 'VLN / VDR + PLKS',
    requiresEmbassyAttestation: false,
    requiresPLKS: true,
    requiresFOMEMA: true,
    requiresVLN: true
  }
};

export const SUPPORTED_COUNTRIES = Object.freeze(Object.values(COUNTRY));

export function getRegionForCountry(country) {
  return COUNTRY_TO_REGION[country] || REGION.OTHER;
}

export function getRegionMetadata(region) {
  return REGION_METADATA[region] || null;
}

export function isV1Supported(country) {
  return Object.prototype.hasOwnProperty.call(COUNTRY_TO_REGION, country);
}
