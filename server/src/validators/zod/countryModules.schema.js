import { z } from "zod";

const optionalDateStr = z.string().trim().max(20).optional().nullable();
const optionalStr = z.string().trim().max(100).optional().nullable();

export const gulfVisaUpdateSchema = z
  .object({
    visaNumber: optionalStr,
    visaReceivedDate: optionalDateStr,
    visaExpiryDate: optionalDateStr,
  })
  .strict();

export const malaysiaPlksUpdateSchema = z
  .object({
    vlnNumber: optionalStr,
    vlnReceivedDate: optionalDateStr,
    vlnExpiryDate: optionalDateStr,
    fwcmsCallingLetterNumber: optionalStr,
    fwcmsReceivedDate: optionalDateStr,
    fomemaReferenceNumber: optionalStr,
    bestinetBiometricRef: optionalStr,
    plksNumber: optionalStr,
    plksIssuedDate: optionalDateStr,
    plksExpiryDate: optionalDateStr,
  })
  .strict();
