/**
 * countryRules.js — Country-specific pipeline requirements for the Nepal
 * foreign employment system.
 *
 * Each entry encodes what is required beyond the common pipeline for that
 * destination country. Controllers and services use this to determine which
 * pipeline steps are mandatory for a given demand.
 */

const RULES = {
  'Qatar': {
    medicalType: 'gamca',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'Kathmandu',
    notes: 'NOC may be required for certain skilled categories.'
  },
  'Saudi Arabia': {
    medicalType: 'gamca',
    requiresTradeTest: true,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'Kathmandu',
    notes: 'Trade test required for skilled workers. Employment contract must be Saudi embassy attested.'
  },
  'UAE': {
    medicalType: 'wafid',
    requiresTradeTest: true,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'Kathmandu',
    notes: 'WAFID medical required instead of GAMCA. Trade test required for skilled categories.'
  },
  'Kuwait': {
    medicalType: 'gamca',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'Kathmandu',
    notes: ''
  },
  'Malaysia': {
    medicalType: 'fomema',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: true,
    visaSystem: 'plks',
    embassyCity: 'Kathmandu',
    notes: 'FOMEMA medical (not GAMCA). E-sticker (PLKS/VDR system) required before departure.'
  },
  'Bahrain': {
    medicalType: 'gamca',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'Kathmandu',
    notes: ''
  },
  'Oman': {
    medicalType: 'gamca',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'Kathmandu',
    notes: ''
  },
  'South Korea': {
    medicalType: 'other',
    requiresTradeTest: true,
    requiresLanguageTest: true,
    languageTestName: 'EPS-TOPIK',
    requiresEsticker: true,
    visaSystem: 'eps',
    embassyCity: 'Kathmandu',
    notes: 'EPS-TOPIK Korean language test mandatory. Quota-based lottery system. EPS card required on arrival.'
  },
  'Japan': {
    medicalType: 'other',
    requiresTradeTest: true,
    requiresLanguageTest: true,
    languageTestName: 'JLPT N4',
    requiresEsticker: false,
    visaSystem: 'ssw',
    embassyCity: 'Kathmandu',
    notes: 'Specified Skilled Worker (SSW) visa. JLPT N4 language test and sector-specific skills test required.'
  },
  'Israel': {
    medicalType: 'other',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'bilateral',
    embassyCity: 'Kathmandu',
    notes: 'Bilateral agreement quota. ICA (Israel Construction Approval) required.'
  },
  'Poland': {
    medicalType: 'other',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'schengen',
    embassyCity: 'New Delhi',
    notes: 'Schengen work visa. Polish embassy is in New Delhi; allow extra transit time for document submission.'
  },
  'Romania': {
    medicalType: 'other',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'New Delhi',
    notes: 'Romanian embassy in New Delhi. Work permit required from Romanian authorities before visa.'
  },
  'Croatia': {
    medicalType: 'other',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'schengen',
    embassyCity: 'New Delhi',
    notes: 'EU member. Schengen work visa via New Delhi.'
  },
  'Other': {
    medicalType: 'other',
    requiresTradeTest: false,
    requiresLanguageTest: false,
    languageTestName: null,
    requiresEsticker: false,
    visaSystem: 'standard',
    embassyCity: 'Kathmandu',
    notes: 'Verify specific requirements with DoFE for non-listed countries.'
  }
};

/**
 * Returns the rule set for a country, falling back to 'Other'.
 * @param {string} country
 * @returns {object}
 */
export function getCountryRules(country) {
  return RULES[country] ?? RULES['Other'];
}

/**
 * Returns the medical type required for a destination country.
 * @param {string} country
 * @returns {'gamca' | 'wafid' | 'fomema' | 'other'}
 */
export function getMedicalTypeForCountry(country) {
  return getCountryRules(country).medicalType;
}

/**
 * Whether an e-sticker is needed for the destination country.
 * @param {string} country
 * @returns {boolean}
 */
export function requiresEsticker(country) {
  return getCountryRules(country).requiresEsticker;
}

/**
 * Whether a language test is required for the destination country.
 * @param {string} country
 * @returns {boolean}
 */
export function requiresLanguageTest(country) {
  return getCountryRules(country).requiresLanguageTest;
}

export default RULES;
