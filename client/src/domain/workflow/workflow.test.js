import { describe, expect, it } from 'vitest';
import {
  // countries
  REGION, COUNTRY, COUNTRY_FLAGS, SUPPORTED_COUNTRIES,
  getRegionForCountry, getRegionMetadata, getCountryFlag, isV1Supported,
  // stages
  STAGE, STATUS, STAGE_DEFINITIONS, STATUS_LABELS, STATUS_COLORS,
  STAGE_FOR_STATUS, STAGE_ORDER, ALL_STATUSES, TERMINAL_STATUSES, BLOCKING_STATUSES,
  getStageForStatus, isTerminal, isBlocking, getStageDefinition,
  getStatusLabel, getStatusColor,
  // pipelines
  PIPELINES, getPipelineForRegion, getPipelineForCountry, getDefaultPipeline,
  listPipelineStages, getDepartureGateRequirements, getFeimsRequiredFields,
} from './index.js';

// ──────────────────────────────────────────────────────────────────────────────
// countries
// ──────────────────────────────────────────────────────────────────────────────

describe('countries — region mapping', () => {
  it('maps every Gulf country to REGION.GULF', () => {
    const gulf = [
      COUNTRY.SAUDI_ARABIA, COUNTRY.UAE, COUNTRY.QATAR,
      COUNTRY.KUWAIT, COUNTRY.BAHRAIN, COUNTRY.OMAN,
    ];
    gulf.forEach(c => expect(getRegionForCountry(c)).toBe(REGION.GULF));
  });

  it('maps Malaysia to REGION.MALAYSIA', () => {
    expect(getRegionForCountry(COUNTRY.MALAYSIA)).toBe(REGION.MALAYSIA);
  });

  it('returns REGION.OTHER for unknown countries', () => {
    expect(getRegionForCountry('Antarctica')).toBe(REGION.OTHER);
    expect(getRegionForCountry(undefined)).toBe(REGION.OTHER);
    expect(getRegionForCountry(null)).toBe(REGION.OTHER);
  });

  it('SUPPORTED_COUNTRIES contains all COUNTRY values', () => {
    Object.values(COUNTRY).forEach(c => expect(SUPPORTED_COUNTRIES).toContain(c));
  });

  it('isV1Supported only returns true for known countries', () => {
    expect(isV1Supported(COUNTRY.QATAR)).toBe(true);
    expect(isV1Supported(COUNTRY.MALAYSIA)).toBe(true);
    expect(isV1Supported('Antarctica')).toBe(false);
    expect(isV1Supported(undefined)).toBe(false);
  });
});

describe('countries — flags & metadata', () => {
  it('returns the correct flag for known countries', () => {
    expect(getCountryFlag(COUNTRY.SAUDI_ARABIA)).toBe('🇸🇦');
    expect(getCountryFlag(COUNTRY.MALAYSIA)).toBe('🇲🇾');
  });

  it('falls back to a globe for unknown countries', () => {
    expect(getCountryFlag('Antarctica')).toBe('🌐');
    expect(getCountryFlag(undefined)).toBe('🌐');
  });

  it('every supported country has a flag', () => {
    SUPPORTED_COUNTRIES.forEach(c => {
      expect(COUNTRY_FLAGS[c]).toBeTruthy();
    });
  });

  it('returns Gulf metadata for the Gulf region', () => {
    const meta = getRegionMetadata(REGION.GULF);
    expect(meta).not.toBeNull();
    expect(meta.medicalSystem).toBe('GAMCA_WAFID');
    expect(meta.requiresPLKS).toBe(false);
    expect(meta.requiresEmbassyAttestation).toBe(true);
  });

  it('returns Malaysia metadata for the Malaysia region', () => {
    const meta = getRegionMetadata(REGION.MALAYSIA);
    expect(meta).not.toBeNull();
    expect(meta.medicalSystem).toBe('FOMEMA_BESTINET');
    expect(meta.requiresPLKS).toBe(true);
    expect(meta.requiresVLN).toBe(true);
  });

  it('returns null for unknown region metadata', () => {
    expect(getRegionMetadata('moon')).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// stages
// ──────────────────────────────────────────────────────────────────────────────

describe('stages — definitions', () => {
  it('every STAGE id has a definition', () => {
    Object.values(STAGE).forEach(stageId => {
      const def = getStageDefinition(stageId);
      expect(def, `stage ${stageId} missing definition`).not.toBeNull();
      expect(def.id).toBe(stageId);
      expect(def.label).toBeTruthy();
      expect(Array.isArray(def.statuses)).toBe(true);
    });
  });

  it('every stage has at least one status', () => {
    STAGE_DEFINITIONS.forEach(s => expect(s.statuses.length).toBeGreaterThan(0));
  });

  it('returns null for unknown stage', () => {
    expect(getStageDefinition('does_not_exist')).toBeNull();
  });
});

describe('stages — status ↔ stage mapping', () => {
  it('every STATUS maps to a stage (except specials)', () => {
    // STATUS_FOR_STATUS only covers non-special; ON_HOLD / CANCELLED are special
    const specials = ['on_hold', 'cancelled'];
    Object.values(STATUS).forEach(s => {
      if (specials.includes(s)) return;
      expect(getStageForStatus(s), `status ${s} missing stage mapping`).toBeTruthy();
    });
  });

  it('special statuses do NOT map to a stage', () => {
    expect(getStageForStatus(STATUS.ON_HOLD)).toBeNull();
    expect(getStageForStatus(STATUS.CANCELLED)).toBeNull();
  });

  it('STAGE_FOR_STATUS lookup matches getStageForStatus()', () => {
    Object.entries(STAGE_FOR_STATUS).forEach(([status, stageId]) => {
      expect(getStageForStatus(status)).toBe(stageId);
    });
  });

  it('STAGE_ORDER is dense and reflects definition order', () => {
    STAGE_DEFINITIONS.forEach((s, idx) => {
      expect(STAGE_ORDER[s.id]).toBe(idx);
    });
  });

  it('ALL_STATUSES contains every STATUS', () => {
    Object.values(STATUS).forEach(s => expect(ALL_STATUSES).toContain(s));
  });
});

describe('stages — labels & colors', () => {
  it('every STATUS has a label', () => {
    Object.values(STATUS).forEach(s => {
      expect(STATUS_LABELS[s], `status ${s} missing label`).toBeTruthy();
    });
  });

  it('every STATUS has a color class', () => {
    Object.values(STATUS).forEach(s => {
      expect(STATUS_COLORS[s], `status ${s} missing color`).toBeTruthy();
    });
  });

  it('getStatusLabel falls back to the raw status', () => {
    expect(getStatusLabel('totally_made_up')).toBe('totally_made_up');
  });

  it('getStatusColor falls back to a gray class', () => {
    expect(getStatusColor('totally_made_up')).toBe('bg-gray-100 text-gray-800');
  });
});

describe('stages — terminal & blocking', () => {
  it('TERMINAL_STATUSES contains the expected terminal states', () => {
    expect(isTerminal(STATUS.DEPARTED)).toBe(true);
    expect(isTerminal(STATUS.RETURNED)).toBe(true);
    expect(isTerminal(STATUS.CANCELLED)).toBe(true);
  });

  it('a registered candidate is not terminal', () => {
    expect(isTerminal(STATUS.REGISTERED)).toBe(false);
    expect(isTerminal(STATUS.MEDICAL_PASSED)).toBe(false);
  });

  it('BLOCKING_STATUSES contains the failure / hold states', () => {
    expect(isBlocking(STATUS.TRADE_TEST_FAILED)).toBe(true);
    expect(isBlocking(STATUS.MEDICAL_FAILED)).toBe(true);
    expect(isBlocking(STATUS.MEDICAL_EXPIRED)).toBe(true);
    expect(isBlocking(STATUS.ORIENTATION_ABSENT)).toBe(true);
    expect(isBlocking(STATUS.VISA_REJECTED)).toBe(true);
    expect(isBlocking(STATUS.ON_HOLD)).toBe(true);
    expect(isBlocking(STATUS.CANCELLED)).toBe(true);
  });

  it('successful states are not blocking', () => {
    expect(isBlocking(STATUS.MEDICAL_PASSED)).toBe(false);
    expect(isBlocking(STATUS.VISA_STAMPED)).toBe(false);
    expect(isBlocking(STATUS.DEPARTED)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// pipelines
// ──────────────────────────────────────────────────────────────────────────────

describe('pipelines', () => {
  it('Gulf pipeline contains VISA_STAMPING but NOT PLKS', () => {
    const ids = PIPELINES[REGION.GULF].stages.map(s => s.id);
    expect(ids).toContain(STAGE.VISA_STAMPING);
    expect(ids).not.toContain(STAGE.PLKS);
  });

  it('Malaysia pipeline contains neither PLKS nor VISA_STAMPING (tracked in Government Compliance card)', () => {
    const ids = PIPELINES[REGION.MALAYSIA].stages.map(s => s.id);
    expect(ids).not.toContain(STAGE.PLKS);
    expect(ids).not.toContain(STAGE.VISA_STAMPING);
  });

  it('neither pipeline contains Purba Swukriti, FEIMS Submission, or Shram Swukriti (Government Compliance card stages)', () => {
    const govtComplianceStages = [STAGE.PURBA_SWUKRITI, STAGE.FEIMS_SUBMISSION, STAGE.SHRAM_SWUKRITI];
    const gulfIds = PIPELINES[REGION.GULF].stages.map(s => s.id);
    const malaysiaIds = PIPELINES[REGION.MALAYSIA].stages.map(s => s.id);
    govtComplianceStages.forEach(stage => {
      expect(gulfIds).not.toContain(stage);
      expect(malaysiaIds).not.toContain(stage);
    });
  });

  it('both pipelines start at REGISTRATION and end at POST_DEPARTURE', () => {
    Object.values(PIPELINES).forEach(p => {
      expect(p.stages[0].id).toBe(STAGE.REGISTRATION);
      expect(p.stages[p.stages.length - 1].id).toBe(STAGE.POST_DEPARTURE);
    });
  });

  it('every pipeline stage has its order field', () => {
    Object.values(PIPELINES).forEach(p => {
      p.stages.forEach((s, idx) => expect(s.order).toBe(idx));
    });
  });

  it('getPipelineForRegion returns null for unknown region', () => {
    expect(getPipelineForRegion('moon')).toBeNull();
  });

  it('getPipelineForCountry returns the right pipeline', () => {
    expect(getPipelineForCountry(COUNTRY.QATAR).region).toBe(REGION.GULF);
    expect(getPipelineForCountry(COUNTRY.MALAYSIA).region).toBe(REGION.MALAYSIA);
  });

  it('getPipelineForCountry returns null for unknown country (no fallback)', () => {
    expect(getPipelineForCountry('Antarctica')).toBeNull();
  });

  it('listPipelineStages falls back to Gulf for unknown country', () => {
    const fallback = listPipelineStages('Antarctica');
    const gulfIds  = PIPELINES[REGION.GULF].stages.map(s => s.id);
    expect(fallback.map(s => s.id)).toEqual(gulfIds);
  });

  it('listPipelineStages returns the Malaysia stages for Malaysia', () => {
    const stages = listPipelineStages(COUNTRY.MALAYSIA);
    const ids    = stages.map(s => s.id);
    expect(ids).not.toContain(STAGE.PLKS);
    expect(ids).not.toContain(STAGE.VISA_STAMPING);
  });

  it('getDefaultPipeline returns Gulf', () => {
    expect(getDefaultPipeline().region).toBe(REGION.GULF);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// departure gate
// ──────────────────────────────────────────────────────────────────────────────

describe('departure gate requirements', () => {
  it('Gulf gate includes visa_stamped, NOT vln_received', () => {
    const ids = getDepartureGateRequirements(COUNTRY.QATAR).map(r => r.id);
    expect(ids).toContain('visa_stamped');
    expect(ids).not.toContain('vln_received');
    expect(ids).not.toContain('plks_received');
  });

  it('Malaysia gate includes vln_received and plks_received, NOT visa_stamped', () => {
    const ids = getDepartureGateRequirements(COUNTRY.MALAYSIA).map(r => r.id);
    expect(ids).toContain('vln_received');
    expect(ids).toContain('plks_received');
    expect(ids).not.toContain('visa_stamped');
  });

  it('common gate items are present for every supported country', () => {
    const expected = [
      'passport_valid', 'demand_letter_valid', 'documents_complete',
      'medical_fit', 'orientation_complete', 'insurance_paid', 'ssf_paid',
      'welfare_paid', 'purba_swukriti_valid', 'feims_registered', 'shram_issued',
    ];
    SUPPORTED_COUNTRIES.forEach(c => {
      const ids = getDepartureGateRequirements(c).map(r => r.id);
      expected.forEach(req => expect(ids, `${c} missing ${req}`).toContain(req));
    });
  });

  it('every gate requirement is marked blocksDeparture', () => {
    SUPPORTED_COUNTRIES.forEach(c => {
      getDepartureGateRequirements(c).forEach(req => {
        expect(req.blocksDeparture).toBe(true);
      });
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// FEIMS required fields
// ──────────────────────────────────────────────────────────────────────────────

describe('FEIMS required fields', () => {
  it('Gulf FEIMS requires visaNumber, NOT vlnNumber/plksNumber', () => {
    const keys = getFeimsRequiredFields(COUNTRY.QATAR).map(f => f.key);
    expect(keys).toContain('visaNumber');
    expect(keys).not.toContain('vlnNumber');
    expect(keys).not.toContain('plksNumber');
  });

  it('Malaysia FEIMS requires vlnNumber and plksNumber, NOT visaNumber', () => {
    const keys = getFeimsRequiredFields(COUNTRY.MALAYSIA).map(f => f.key);
    expect(keys).toContain('vlnNumber');
    expect(keys).toContain('plksNumber');
    expect(keys).not.toContain('visaNumber');
  });

  it('common FEIMS fields are present for every supported country', () => {
    const expected = [
      'fullName', 'dateOfBirth', 'gender', 'nationalIdNumber', 'phone',
      'permanentDistrict', 'permanentMunicipality', 'permanentWardNo',
      'passportNumber', 'desiredCountry', 'desiredJobCategory',
    ];
    SUPPORTED_COUNTRIES.forEach(c => {
      const keys = getFeimsRequiredFields(c).map(f => f.key);
      expected.forEach(k => expect(keys, `${c} missing ${k}`).toContain(k));
    });
  });
});
