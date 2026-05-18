import { describe, it, expect } from '@jest/globals';
import {
  PIPELINES,
  getPipelineForRegion,
  getPipelineForCountry,
  getDefaultPipeline,
  listPipelineStages,
  getDepartureGateRequirements,
  getFeimsRequiredFields
} from '../../src/domain/workflow/pipelines.js';
import { STAGE, STAGE_DEFINITIONS } from '../../src/domain/workflow/stages.js';
import { REGION } from '../../src/domain/workflow/countries.js';

describe('Workflow — Pipelines', () => {
  // ─── Gulf pipeline ──────────────────────────────────────────────────────────

  describe('Gulf pipeline', () => {
    const gulf = PIPELINES[REGION.GULF];

    it('exists and is frozen', () => {
      expect(gulf).toBeDefined();
      expect(Object.isFrozen(gulf)).toBe(true);
    });

    it('has 11 stages (govt-compliance stages moved to Compliance card)', () => {
      expect(gulf.stages).toHaveLength(11);
    });

    it('includes VISA_STAMPING', () => {
      const ids = gulf.stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('does NOT include PLKS', () => {
      const ids = gulf.stages.map(s => s.id);
      expect(ids).not.toContain(STAGE.PLKS);
    });

    it('does NOT include Government Compliance stages (tracked on Compliance card)', () => {
      const ids = gulf.stages.map(s => s.id);
      expect(ids).not.toContain(STAGE.PURBA_SWUKRITI);
      expect(ids).not.toContain(STAGE.FEIMS_SUBMISSION);
      expect(ids).not.toContain(STAGE.SHRAM_SWUKRITI);
    });

    it('starts with REGISTRATION', () => {
      expect(gulf.stages[0].id).toBe(STAGE.REGISTRATION);
    });

    it('ends with POST_DEPARTURE', () => {
      const last = gulf.stages[gulf.stages.length - 1];
      expect(last.id).toBe(STAGE.POST_DEPARTURE);
    });

    it('has stages in ascending order', () => {
      for (let i = 1; i < gulf.stages.length; i++) {
        expect(gulf.stages[i].order).toBeGreaterThan(gulf.stages[i - 1].order);
      }
    });

    it('CALLING_VISA comes before VISA_STAMPING', () => {
      const ids = gulf.stages.map(s => s.id);
      expect(ids.indexOf(STAGE.CALLING_VISA)).toBeLessThan(ids.indexOf(STAGE.VISA_STAMPING));
    });

    it('VISA_STAMPING comes before DEPARTURE_PREP', () => {
      const ids = gulf.stages.map(s => s.id);
      expect(ids.indexOf(STAGE.VISA_STAMPING)).toBeLessThan(ids.indexOf(STAGE.DEPARTURE_PREP));
    });
  });

  // ─── Malaysia pipeline ──────────────────────────────────────────────────────

  describe('Malaysia pipeline', () => {
    const malaysia = PIPELINES[REGION.MALAYSIA];

    it('exists and is frozen', () => {
      expect(malaysia).toBeDefined();
      expect(Object.isFrozen(malaysia)).toBe(true);
    });

    it('has 10 stages (govt-compliance stages + PLKS moved to Compliance card)', () => {
      expect(malaysia.stages).toHaveLength(10);
    });

    it('does NOT include PLKS (tracked on Compliance card)', () => {
      const ids = malaysia.stages.map(s => s.id);
      expect(ids).not.toContain(STAGE.PLKS);
    });

    it('does NOT include VISA_STAMPING', () => {
      const ids = malaysia.stages.map(s => s.id);
      expect(ids).not.toContain(STAGE.VISA_STAMPING);
    });

    it('does NOT include Government Compliance stages (tracked on Compliance card)', () => {
      const ids = malaysia.stages.map(s => s.id);
      expect(ids).not.toContain(STAGE.PURBA_SWUKRITI);
      expect(ids).not.toContain(STAGE.FEIMS_SUBMISSION);
      expect(ids).not.toContain(STAGE.SHRAM_SWUKRITI);
    });

    it('starts with REGISTRATION', () => {
      expect(malaysia.stages[0].id).toBe(STAGE.REGISTRATION);
    });

    it('ends with POST_DEPARTURE', () => {
      const last = malaysia.stages[malaysia.stages.length - 1];
      expect(last.id).toBe(STAGE.POST_DEPARTURE);
    });

    it('CALLING_VISA comes before DEPARTURE_PREP', () => {
      const ids = malaysia.stages.map(s => s.id);
      expect(ids.indexOf(STAGE.CALLING_VISA)).toBeLessThan(ids.indexOf(STAGE.DEPARTURE_PREP));
    });
  });

  // ─── Pipeline lookup helpers ─────────────────────────────────────────────────

  describe('getPipelineForRegion()', () => {
    it('returns Gulf pipeline for REGION.GULF', () => {
      expect(getPipelineForRegion(REGION.GULF)).toBe(PIPELINES[REGION.GULF]);
    });

    it('returns Malaysia pipeline for REGION.MALAYSIA', () => {
      expect(getPipelineForRegion(REGION.MALAYSIA)).toBe(PIPELINES[REGION.MALAYSIA]);
    });

    it('returns null for an unknown region', () => {
      expect(getPipelineForRegion('korea')).toBeNull();
    });
  });

  describe('getPipelineForCountry()', () => {
    it('returns Gulf pipeline for Saudi Arabia', () => {
      const pipeline = getPipelineForCountry('Saudi Arabia');
      const ids = pipeline.stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('returns Gulf pipeline for UAE', () => {
      const pipeline = getPipelineForCountry('UAE');
      const ids = pipeline.stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('returns Gulf pipeline for Qatar', () => {
      const pipeline = getPipelineForCountry('Qatar');
      const ids = pipeline.stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('returns Gulf pipeline for Kuwait', () => {
      const pipeline = getPipelineForCountry('Kuwait');
      const ids = pipeline.stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('returns Gulf pipeline for Bahrain', () => {
      const pipeline = getPipelineForCountry('Bahrain');
      const ids = pipeline.stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('returns Gulf pipeline for Oman', () => {
      const pipeline = getPipelineForCountry('Oman');
      const ids = pipeline.stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('returns Malaysia pipeline for Malaysia', () => {
      const pipeline = getPipelineForCountry('Malaysia');
      const ids = pipeline.stages.map(s => s.id);
      expect(ids).not.toContain(STAGE.PLKS);
      expect(ids).not.toContain(STAGE.VISA_STAMPING);
      expect(pipeline).toBe(PIPELINES[REGION.MALAYSIA]);
    });

    it('returns null for an unsupported country (fallback is in listPipelineStages, not here)', () => {
      const pipeline = getPipelineForCountry('Korea');
      expect(pipeline).toBeNull();
    });
  });

  describe('getDefaultPipeline()', () => {
    it('returns the Gulf pipeline as default', () => {
      expect(getDefaultPipeline()).toBe(PIPELINES[REGION.GULF]);
    });
  });

  describe('listPipelineStages()', () => {
    it('returns Gulf stages for Saudi Arabia', () => {
      const stages = listPipelineStages('Saudi Arabia');
      const ids = stages.map(s => s.id);
      expect(ids).toContain(STAGE.VISA_STAMPING);
    });

    it('returns Malaysia stages for Malaysia (slimmed — PLKS now on Compliance card)', () => {
      const stages = listPipelineStages('Malaysia');
      const ids = stages.map(s => s.id);
      expect(ids).not.toContain(STAGE.PLKS);
      expect(ids).not.toContain(STAGE.VISA_STAMPING);
      expect(ids[0]).toBe(STAGE.REGISTRATION);
    });

    it('returns an array of stage objects with id and statuses', () => {
      const stages = listPipelineStages('UAE');
      for (const stage of stages) {
        expect(stage).toHaveProperty('id');
        expect(stage).toHaveProperty('statuses');
      }
    });
  });

  // ─── Departure gate requirements ────────────────────────────────────────────

  describe('getDepartureGateRequirements()', () => {
    const COMMON_IDS = [
      'passport_valid',
      'demand_letter_valid',
      'documents_complete',
      'medical_fit',
      'medical_not_expired',
      'orientation_complete',
      'insurance_paid',
      'ssf_paid',
      'welfare_paid',
      'purba_swukriti_valid',
      'feims_registered',
      'shram_issued'
    ];

    it('Gulf gate contains all 12 common requirements + visa_stamped (13 total)', () => {
      const reqs = getDepartureGateRequirements('Saudi Arabia');
      expect(reqs).toHaveLength(13);
    });

    it('Malaysia gate contains all 12 common requirements + vln_received + plks_received (14 total)', () => {
      const reqs = getDepartureGateRequirements('Malaysia');
      expect(reqs).toHaveLength(14);
    });

    it('Gulf gate includes visa_stamped', () => {
      const reqs = getDepartureGateRequirements('UAE');
      const ids = reqs.map(r => r.id);
      expect(ids).toContain('visa_stamped');
    });

    it('Gulf gate does NOT include plks_received', () => {
      const reqs = getDepartureGateRequirements('Qatar');
      const ids = reqs.map(r => r.id);
      expect(ids).not.toContain('plks_received');
    });

    it('Malaysia gate includes plks_received', () => {
      const reqs = getDepartureGateRequirements('Malaysia');
      const ids = reqs.map(r => r.id);
      expect(ids).toContain('plks_received');
    });

    it('Malaysia gate includes vln_received', () => {
      const reqs = getDepartureGateRequirements('Malaysia');
      const ids = reqs.map(r => r.id);
      expect(ids).toContain('vln_received');
    });

    it('Malaysia gate does NOT include visa_stamped', () => {
      const reqs = getDepartureGateRequirements('Malaysia');
      const ids = reqs.map(r => r.id);
      expect(ids).not.toContain('visa_stamped');
    });

    it('every requirement has blocksDeparture: true', () => {
      const gulfReqs = getDepartureGateRequirements('Saudi Arabia');
      const malaysiaReqs = getDepartureGateRequirements('Malaysia');
      for (const req of [...gulfReqs, ...malaysiaReqs]) {
        expect(req.blocksDeparture).toBe(true);
      }
    });

    it('all common requirements are present in Gulf gate', () => {
      const reqs = getDepartureGateRequirements('Saudi Arabia');
      const ids = reqs.map(r => r.id);
      for (const id of COMMON_IDS) {
        expect(ids).toContain(id);
      }
    });

    it('all common requirements are present in Malaysia gate', () => {
      const reqs = getDepartureGateRequirements('Malaysia');
      const ids = reqs.map(r => r.id);
      for (const id of COMMON_IDS) {
        expect(ids).toContain(id);
      }
    });

    it('every requirement has an id and a label', () => {
      const reqs = getDepartureGateRequirements('Oman');
      for (const req of reqs) {
        expect(typeof req.id).toBe('string');
        expect(req.id.length).toBeGreaterThan(0);
        expect(typeof req.label).toBe('string');
        expect(req.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── FEIMS required fields ──────────────────────────────────────────────────

  describe('getFeimsRequiredFields()', () => {
    const COMMON_KEYS = [
      'fullName',
      'dateOfBirth',
      'gender',
      'nationalIdNumber',
      'phone',
      'permanentDistrict',
      'permanentMunicipality',
      'permanentWardNo',
      'passportNumber',
      'desiredCountry',
      'desiredJobCategory'
    ];

    it('Gulf fields include visaNumber', () => {
      const fields = getFeimsRequiredFields('Saudi Arabia');
      const keys = fields.map(f => f.key);
      expect(keys).toContain('visaNumber');
    });

    it('Gulf fields do NOT include vlnNumber or plksNumber', () => {
      const fields = getFeimsRequiredFields('UAE');
      const keys = fields.map(f => f.key);
      expect(keys).not.toContain('vlnNumber');
      expect(keys).not.toContain('plksNumber');
    });

    it('Malaysia fields include vlnNumber and plksNumber', () => {
      const fields = getFeimsRequiredFields('Malaysia');
      const keys = fields.map(f => f.key);
      expect(keys).toContain('vlnNumber');
      expect(keys).toContain('plksNumber');
    });

    it('Malaysia fields do NOT include visaNumber', () => {
      const fields = getFeimsRequiredFields('Malaysia');
      const keys = fields.map(f => f.key);
      expect(keys).not.toContain('visaNumber');
    });

    it('all 11 common fields are present for Gulf', () => {
      const fields = getFeimsRequiredFields('Qatar');
      const keys = fields.map(f => f.key);
      for (const key of COMMON_KEYS) {
        expect(keys).toContain(key);
      }
    });

    it('all 11 common fields are present for Malaysia', () => {
      const fields = getFeimsRequiredFields('Malaysia');
      const keys = fields.map(f => f.key);
      for (const key of COMMON_KEYS) {
        expect(keys).toContain(key);
      }
    });

    it('every field has a key and a label', () => {
      const fields = getFeimsRequiredFields('Kuwait');
      for (const field of fields) {
        expect(typeof field.key).toBe('string');
        expect(field.key.length).toBeGreaterThan(0);
        expect(typeof field.label).toBe('string');
        expect(field.label.length).toBeGreaterThan(0);
      }
    });
  });
});
