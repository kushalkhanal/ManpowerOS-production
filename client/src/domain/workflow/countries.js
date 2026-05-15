/**
 * Countries — client-side mirror of server/src/domain/workflow/countries.js.
 *
 * Pure module — no React, no API, no Redux. Safe to import anywhere.
 * Adds UI-only metadata (flag, color hint) on top of the server domain.
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

export const COUNTRY_FLAGS = Object.freeze({
  [COUNTRY.SAUDI_ARABIA]: '🇸🇦',
  [COUNTRY.UAE]:          '🇦🇪',
  [COUNTRY.QATAR]:        '🇶🇦',
  [COUNTRY.KUWAIT]:       '🇰🇼',
  [COUNTRY.BAHRAIN]:      '🇧🇭',
  [COUNTRY.OMAN]:         '🇴🇲',
  [COUNTRY.MALAYSIA]:     '🇲🇾'
});

const REGION_METADATA = {
  [REGION.GULF]: {
    medicalSystem: 'GAMCA_WAFID',
    medicalLabel: 'GAMCA / Wafid',
    visaSystem: 'EMBASSY_STAMPING',
    visaLabel: 'Calling Visa + Embassy Stamping',
    requiresEmbassyAttestation: true,
    requiresPLKS: false,
    requiresFOMEMA: false,
    requiresVLN: false,
    accentColor: 'amber'
  },
  [REGION.MALAYSIA]: {
    medicalSystem: 'FOMEMA_BESTINET',
    medicalLabel: 'FOMEMA / Bestinet',
    visaSystem: 'VLN_PLKS',
    visaLabel: 'VLN / VDR + PLKS',
    requiresEmbassyAttestation: false,
    requiresPLKS: true,
    requiresFOMEMA: true,
    requiresVLN: true,
    accentColor: 'rose'
  }
};

export const SUPPORTED_COUNTRIES = Object.freeze(Object.values(COUNTRY));

export function getRegionForCountry(country) {
  return COUNTRY_TO_REGION[country] || REGION.OTHER;
}

export function getRegionMetadata(region) {
  return REGION_METADATA[region] || null;
}

export function getCountryFlag(country) {
  return COUNTRY_FLAGS[country] || '🌐';
}

export function isV1Supported(country) {
  return Object.prototype.hasOwnProperty.call(COUNTRY_TO_REGION, country);
}
