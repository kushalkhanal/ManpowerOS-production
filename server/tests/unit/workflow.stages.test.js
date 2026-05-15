import { describe, it, expect } from '@jest/globals';
import {
  STAGE,
  STATUS,
  STAGE_DEFINITIONS,
  ALL_STATUSES,
  SPECIAL_STATUSES,
  TERMINAL_STATUSES,
  BLOCKING_STATUSES,
  STAGE_FOR_STATUS,
  STAGE_ORDER,
  getStageForStatus,
  isTerminal,
  isBlocking,
  getStageDefinition
} from '../../src/domain/workflow/stages.js';

describe('Workflow — Stages', () => {
  // ─── Completeness guards ────────────────────────────────────────────────────

  describe('STAGE_DEFINITIONS completeness', () => {
    it('defines all 15 pipeline stages', () => {
      expect(STAGE_DEFINITIONS).toHaveLength(15);
    });

    it('includes every STAGE constant', () => {
      const definedIds = new Set(STAGE_DEFINITIONS.map(s => s.id));
      for (const id of Object.values(STAGE)) {
        expect(definedIds.has(id)).toBe(true);
      }
    });

    it('every stage definition has a non-empty statuses array', () => {
      for (const stage of STAGE_DEFINITIONS) {
        expect(stage.statuses.length).toBeGreaterThan(0);
      }
    });

    it('stage ids are unique', () => {
      const ids = STAGE_DEFINITIONS.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('no status belongs to more than one stage', () => {
      const seen = new Set();
      for (const stage of STAGE_DEFINITIONS) {
        for (const status of stage.statuses) {
          expect(seen.has(status)).toBe(false);
          seen.add(status);
        }
      }
    });
  });

  describe('ALL_STATUSES', () => {
    it('contains every status from every stage', () => {
      const fromStages = STAGE_DEFINITIONS.flatMap(s => s.statuses);
      for (const status of fromStages) {
        expect(ALL_STATUSES).toContain(status);
      }
    });

    it('contains the special statuses', () => {
      for (const status of SPECIAL_STATUSES) {
        expect(ALL_STATUSES).toContain(status);
      }
    });

    it('has no duplicate entries', () => {
      expect(new Set(ALL_STATUSES).size).toBe(ALL_STATUSES.length);
    });

    it('includes on_hold and cancelled', () => {
      expect(ALL_STATUSES).toContain('on_hold');
      expect(ALL_STATUSES).toContain('cancelled');
    });
  });

  // ─── Stage ordering ─────────────────────────────────────────────────────────

  describe('STAGE_ORDER', () => {
    it('registration is the first stage (order 0)', () => {
      expect(STAGE_ORDER[STAGE.REGISTRATION]).toBe(0);
    });

    it('post_departure is the last stage', () => {
      const maxOrder = Math.max(...Object.values(STAGE_ORDER));
      expect(STAGE_ORDER[STAGE.POST_DEPARTURE]).toBe(maxOrder);
    });

    it('medical comes before compliance', () => {
      expect(STAGE_ORDER[STAGE.MEDICAL]).toBeLessThan(STAGE_ORDER[STAGE.COMPLIANCE]);
    });

    it('compliance comes before orientation', () => {
      expect(STAGE_ORDER[STAGE.COMPLIANCE]).toBeLessThan(STAGE_ORDER[STAGE.ORIENTATION]);
    });

    it('feims_submission comes before shram_swukriti', () => {
      expect(STAGE_ORDER[STAGE.FEIMS_SUBMISSION]).toBeLessThan(STAGE_ORDER[STAGE.SHRAM_SWUKRITI]);
    });

    it('shram_swukriti comes before departure_prep', () => {
      expect(STAGE_ORDER[STAGE.SHRAM_SWUKRITI]).toBeLessThan(STAGE_ORDER[STAGE.DEPARTURE_PREP]);
    });

    it('departure_prep comes before post_departure', () => {
      expect(STAGE_ORDER[STAGE.DEPARTURE_PREP]).toBeLessThan(STAGE_ORDER[STAGE.POST_DEPARTURE]);
    });
  });

  // ─── STAGE_FOR_STATUS lookup ────────────────────────────────────────────────

  describe('STAGE_FOR_STATUS', () => {
    it('maps registered → registration', () => {
      expect(STAGE_FOR_STATUS[STATUS.REGISTERED]).toBe(STAGE.REGISTRATION);
    });

    it('maps demand_allocated → demand_matching', () => {
      expect(STAGE_FOR_STATUS[STATUS.DEMAND_ALLOCATED]).toBe(STAGE.DEMAND_MATCHING);
    });

    it('maps medical_passed → medical', () => {
      expect(STAGE_FOR_STATUS[STATUS.MEDICAL_PASSED]).toBe(STAGE.MEDICAL);
    });

    it('maps medical_failed → medical', () => {
      expect(STAGE_FOR_STATUS[STATUS.MEDICAL_FAILED]).toBe(STAGE.MEDICAL);
    });

    it('maps insurance_done → compliance', () => {
      expect(STAGE_FOR_STATUS[STATUS.INSURANCE_DONE]).toBe(STAGE.COMPLIANCE);
    });

    it('maps ssf_done → compliance', () => {
      expect(STAGE_FOR_STATUS[STATUS.SSF_DONE]).toBe(STAGE.COMPLIANCE);
    });

    it('maps visa_stamped → visa_stamping', () => {
      expect(STAGE_FOR_STATUS[STATUS.VISA_STAMPED]).toBe(STAGE.VISA_STAMPING);
    });

    it('maps plks_received → plks', () => {
      expect(STAGE_FOR_STATUS[STATUS.PLKS_RECEIVED]).toBe(STAGE.PLKS);
    });

    it('maps feims_submitted → feims_submission', () => {
      expect(STAGE_FOR_STATUS[STATUS.FEIMS_SUBMITTED]).toBe(STAGE.FEIMS_SUBMISSION);
    });

    it('maps shram_issued → shram_swukriti', () => {
      expect(STAGE_FOR_STATUS[STATUS.SHRAM_ISSUED]).toBe(STAGE.SHRAM_SWUKRITI);
    });

    it('maps departed → post_departure', () => {
      expect(STAGE_FOR_STATUS[STATUS.DEPARTED]).toBe(STAGE.POST_DEPARTURE);
    });

    it('covers all stage statuses', () => {
      for (const stage of STAGE_DEFINITIONS) {
        for (const status of stage.statuses) {
          expect(STAGE_FOR_STATUS[status]).toBe(stage.id);
        }
      }
    });

    it('does not map on_hold or cancelled to any stage', () => {
      expect(STAGE_FOR_STATUS[STATUS.ON_HOLD]).toBeUndefined();
      expect(STAGE_FOR_STATUS[STATUS.CANCELLED]).toBeUndefined();
    });
  });

  // ─── TERMINAL_STATUSES ──────────────────────────────────────────────────────

  describe('TERMINAL_STATUSES', () => {
    it('includes departed', () => {
      expect(TERMINAL_STATUSES.has(STATUS.DEPARTED)).toBe(true);
    });

    it('includes returned', () => {
      expect(TERMINAL_STATUSES.has(STATUS.RETURNED)).toBe(true);
    });

    it('includes cancelled', () => {
      expect(TERMINAL_STATUSES.has(STATUS.CANCELLED)).toBe(true);
    });

    it('does not include abroad (still active)', () => {
      expect(TERMINAL_STATUSES.has(STATUS.ABROAD)).toBe(false);
    });

    it('does not include on_hold (reversible)', () => {
      expect(TERMINAL_STATUSES.has(STATUS.ON_HOLD)).toBe(false);
    });
  });

  // ─── BLOCKING_STATUSES ──────────────────────────────────────────────────────

  describe('BLOCKING_STATUSES', () => {
    it('includes trade_test_failed', () => {
      expect(BLOCKING_STATUSES.has(STATUS.TRADE_TEST_FAILED)).toBe(true);
    });

    it('includes medical_failed', () => {
      expect(BLOCKING_STATUSES.has(STATUS.MEDICAL_FAILED)).toBe(true);
    });

    it('includes medical_expired', () => {
      expect(BLOCKING_STATUSES.has(STATUS.MEDICAL_EXPIRED)).toBe(true);
    });

    it('includes orientation_absent', () => {
      expect(BLOCKING_STATUSES.has(STATUS.ORIENTATION_ABSENT)).toBe(true);
    });

    it('includes visa_rejected', () => {
      expect(BLOCKING_STATUSES.has(STATUS.VISA_REJECTED)).toBe(true);
    });

    it('includes on_hold', () => {
      expect(BLOCKING_STATUSES.has(STATUS.ON_HOLD)).toBe(true);
    });

    it('includes cancelled', () => {
      expect(BLOCKING_STATUSES.has(STATUS.CANCELLED)).toBe(true);
    });

    it('does not include medical_passed', () => {
      expect(BLOCKING_STATUSES.has(STATUS.MEDICAL_PASSED)).toBe(false);
    });

    it('does not include visa_stamped', () => {
      expect(BLOCKING_STATUSES.has(STATUS.VISA_STAMPED)).toBe(false);
    });
  });

  // ─── Helper functions ───────────────────────────────────────────────────────

  describe('getStageForStatus()', () => {
    it('returns the correct stage id', () => {
      expect(getStageForStatus('registered')).toBe('registration');
      expect(getStageForStatus('medical_passed')).toBe('medical');
      expect(getStageForStatus('feims_registered')).toBe('feims_submission');
    });

    it('returns null for on_hold (cross-cutting)', () => {
      expect(getStageForStatus('on_hold')).toBeNull();
    });

    it('returns null for unknown status', () => {
      expect(getStageForStatus('nonexistent_status')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(getStageForStatus('')).toBeNull();
    });
  });

  describe('isTerminal()', () => {
    it('returns true for departed', () => {
      expect(isTerminal('departed')).toBe(true);
    });

    it('returns true for cancelled', () => {
      expect(isTerminal('cancelled')).toBe(true);
    });

    it('returns true for returned', () => {
      expect(isTerminal('returned')).toBe(true);
    });

    it('returns false for abroad', () => {
      expect(isTerminal('abroad')).toBe(false);
    });

    it('returns false for registered', () => {
      expect(isTerminal('registered')).toBe(false);
    });
  });

  describe('isBlocking()', () => {
    it('returns true for medical_failed', () => {
      expect(isBlocking('medical_failed')).toBe(true);
    });

    it('returns true for visa_rejected', () => {
      expect(isBlocking('visa_rejected')).toBe(true);
    });

    it('returns false for visa_stamped', () => {
      expect(isBlocking('visa_stamped')).toBe(false);
    });

    it('returns false for registered', () => {
      expect(isBlocking('registered')).toBe(false);
    });
  });

  describe('getStageDefinition()', () => {
    it('returns the correct definition for a known stage', () => {
      const def = getStageDefinition(STAGE.MEDICAL);
      expect(def).not.toBeNull();
      expect(def.id).toBe(STAGE.MEDICAL);
      expect(def.statuses).toContain(STATUS.MEDICAL_PASSED);
    });

    it('returns null for an unknown stage id', () => {
      expect(getStageDefinition('nonexistent')).toBeNull();
    });

    it('returned definition has the expected shape', () => {
      const def = getStageDefinition(STAGE.REGISTRATION);
      expect(def).toHaveProperty('id', STAGE.REGISTRATION);
      expect(def).toHaveProperty('statuses');
      expect(def).toHaveProperty('label');
    });

    it('trade_test stage is marked optional', () => {
      const def = getStageDefinition(STAGE.TRADE_TEST);
      expect(def.optional).toBe(true);
    });

    it('registration stage is not optional', () => {
      const def = getStageDefinition(STAGE.REGISTRATION);
      expect(def.optional).toBeFalsy();
    });
  });

  // ─── Region-restricted stages ───────────────────────────────────────────────

  describe('region-restricted stages', () => {
    it('visa_stamping is restricted to gulf region', () => {
      const def = getStageDefinition(STAGE.VISA_STAMPING);
      expect(def.regions).toEqual(['gulf']);
    });

    it('plks is restricted to malaysia region', () => {
      const def = getStageDefinition(STAGE.PLKS);
      expect(def.regions).toEqual(['malaysia']);
    });

    it('registration has no region restriction', () => {
      const def = getStageDefinition(STAGE.REGISTRATION);
      expect(def.regions).toBeUndefined();
    });
  });
});
