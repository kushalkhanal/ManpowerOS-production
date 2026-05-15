import { describe, it, expect } from '@jest/globals';
import {
  REGION,
  COUNTRY,
  SUPPORTED_COUNTRIES,
  getRegionForCountry,
  getRegionMetadata,
  isV1Supported
} from '../../src/domain/workflow/countries.js';

describe('Workflow — Countries', () => {
  // ─── REGION constants ────────────────────────────────────────────────────────

  describe('REGION', () => {
    it('defines gulf, malaysia, and other', () => {
      expect(REGION.GULF).toBe('gulf');
      expect(REGION.MALAYSIA).toBe('malaysia');
      expect(REGION.OTHER).toBe('other');
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(REGION)).toBe(true);
    });
  });

  // ─── COUNTRY constants ───────────────────────────────────────────────────────

  describe('COUNTRY', () => {
    it('contains all 6 Gulf countries and Malaysia', () => {
      expect(COUNTRY.SAUDI_ARABIA).toBe('Saudi Arabia');
      expect(COUNTRY.UAE).toBe('UAE');
      expect(COUNTRY.QATAR).toBe('Qatar');
      expect(COUNTRY.KUWAIT).toBe('Kuwait');
      expect(COUNTRY.BAHRAIN).toBe('Bahrain');
      expect(COUNTRY.OMAN).toBe('Oman');
      expect(COUNTRY.MALAYSIA).toBe('Malaysia');
    });

    it('is frozen', () => {
      expect(Object.isFrozen(COUNTRY)).toBe(true);
    });
  });

  // ─── SUPPORTED_COUNTRIES ────────────────────────────────────────────────────

  describe('SUPPORTED_COUNTRIES', () => {
    it('has 7 entries', () => {
      expect(SUPPORTED_COUNTRIES).toHaveLength(7);
    });

    it('includes all 6 Gulf countries', () => {
      expect(SUPPORTED_COUNTRIES).toContain('Saudi Arabia');
      expect(SUPPORTED_COUNTRIES).toContain('UAE');
      expect(SUPPORTED_COUNTRIES).toContain('Qatar');
      expect(SUPPORTED_COUNTRIES).toContain('Kuwait');
      expect(SUPPORTED_COUNTRIES).toContain('Bahrain');
      expect(SUPPORTED_COUNTRIES).toContain('Oman');
    });

    it('includes Malaysia', () => {
      expect(SUPPORTED_COUNTRIES).toContain('Malaysia');
    });

    it('does not include unsupported countries', () => {
      expect(SUPPORTED_COUNTRIES).not.toContain('Korea');
      expect(SUPPORTED_COUNTRIES).not.toContain('Japan');
      expect(SUPPORTED_COUNTRIES).not.toContain('Israel');
    });
  });

  // ─── getRegionForCountry() ───────────────────────────────────────────────────

  describe('getRegionForCountry()', () => {
    it('maps Saudi Arabia → gulf', () => {
      expect(getRegionForCountry('Saudi Arabia')).toBe(REGION.GULF);
    });

    it('maps UAE → gulf', () => {
      expect(getRegionForCountry('UAE')).toBe(REGION.GULF);
    });

    it('maps Qatar → gulf', () => {
      expect(getRegionForCountry('Qatar')).toBe(REGION.GULF);
    });

    it('maps Kuwait → gulf', () => {
      expect(getRegionForCountry('Kuwait')).toBe(REGION.GULF);
    });

    it('maps Bahrain → gulf', () => {
      expect(getRegionForCountry('Bahrain')).toBe(REGION.GULF);
    });

    it('maps Oman → gulf', () => {
      expect(getRegionForCountry('Oman')).toBe(REGION.GULF);
    });

    it('maps Malaysia → malaysia', () => {
      expect(getRegionForCountry('Malaysia')).toBe(REGION.MALAYSIA);
    });

    it('returns other for unsupported countries', () => {
      expect(getRegionForCountry('Korea')).toBe(REGION.OTHER);
      expect(getRegionForCountry('Japan')).toBe(REGION.OTHER);
      expect(getRegionForCountry('Germany')).toBe(REGION.OTHER);
    });

    it('returns other for empty string', () => {
      expect(getRegionForCountry('')).toBe(REGION.OTHER);
    });

    it('returns other for undefined', () => {
      expect(getRegionForCountry(undefined)).toBe(REGION.OTHER);
    });

    it('is case-sensitive (Saudi arabia ≠ Saudi Arabia)', () => {
      expect(getRegionForCountry('saudi arabia')).toBe(REGION.OTHER);
    });
  });

  // ─── getRegionMetadata() ─────────────────────────────────────────────────────

  describe('getRegionMetadata()', () => {
    describe('Gulf metadata', () => {
      const meta = getRegionMetadata(REGION.GULF);

      it('returns metadata for gulf', () => {
        expect(meta).not.toBeNull();
      });

      it('uses GAMCA/Wafid medical system', () => {
        expect(meta.medicalSystem).toBe('GAMCA_WAFID');
      });

      it('uses Embassy Stamping visa system', () => {
        expect(meta.visaSystem).toBe('EMBASSY_STAMPING');
      });

      it('requires embassy attestation', () => {
        expect(meta.requiresEmbassyAttestation).toBe(true);
      });

      it('does NOT require PLKS', () => {
        expect(meta.requiresPLKS).toBe(false);
      });

      it('does NOT require FOMEMA', () => {
        expect(meta.requiresFOMEMA).toBe(false);
      });

      it('does NOT require VLN', () => {
        expect(meta.requiresVLN).toBe(false);
      });
    });

    describe('Malaysia metadata', () => {
      const meta = getRegionMetadata(REGION.MALAYSIA);

      it('returns metadata for malaysia', () => {
        expect(meta).not.toBeNull();
      });

      it('uses FOMEMA/Bestinet medical system', () => {
        expect(meta.medicalSystem).toBe('FOMEMA_BESTINET');
      });

      it('uses VLN/PLKS visa system', () => {
        expect(meta.visaSystem).toBe('VLN_PLKS');
      });

      it('does NOT require embassy attestation', () => {
        expect(meta.requiresEmbassyAttestation).toBe(false);
      });

      it('requires PLKS', () => {
        expect(meta.requiresPLKS).toBe(true);
      });

      it('requires FOMEMA', () => {
        expect(meta.requiresFOMEMA).toBe(true);
      });

      it('requires VLN', () => {
        expect(meta.requiresVLN).toBe(true);
      });
    });

    it('returns null for an unknown region', () => {
      expect(getRegionMetadata('unknown')).toBeNull();
    });

    it('returns null for REGION.OTHER', () => {
      expect(getRegionMetadata(REGION.OTHER)).toBeNull();
    });
  });

  // ─── isV1Supported() ─────────────────────────────────────────────────────────

  describe('isV1Supported()', () => {
    it('returns true for all 6 Gulf countries', () => {
      expect(isV1Supported('Saudi Arabia')).toBe(true);
      expect(isV1Supported('UAE')).toBe(true);
      expect(isV1Supported('Qatar')).toBe(true);
      expect(isV1Supported('Kuwait')).toBe(true);
      expect(isV1Supported('Bahrain')).toBe(true);
      expect(isV1Supported('Oman')).toBe(true);
    });

    it('returns true for Malaysia', () => {
      expect(isV1Supported('Malaysia')).toBe(true);
    });

    it('returns false for Korea', () => {
      expect(isV1Supported('Korea')).toBe(false);
    });

    it('returns false for Japan', () => {
      expect(isV1Supported('Japan')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isV1Supported('')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isV1Supported(undefined)).toBe(false);
    });
  });
});
