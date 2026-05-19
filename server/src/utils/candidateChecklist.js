// 10-column workflow matching Nepal DoFE 5-phase process
export const DOCUMENT_CHECKLIST_KEYS = {
  passport_collection: [
    "passport_received",
    "passport_verified",
    "passport_renewed",
  ],
  medical: [
    "medical_scheduled",
    "medical_conducted",
    "result_received",
    "report_uploaded",
  ],
  insurance: [
    "insurance_paid",
    "policy_generated",
    "ssf_registered",
    "ssf_receipt",
  ],
  calling_visa: [
    "demand_letter_confirmed",
    "visa_number_obtained",
    "visa_approval_confirmed",
  ],
  visa: ["embassy_submitted", "visa_stamped", "passport_returned"],
  fee: ["fee_agreed", "partial_payment", "full_payment", "receipt_issued"],
  flight: [
    "ticket_booked",
    "ticket_confirmed",
    "airline_confirmed",
    "airport_time_set",
  ],
  dofe: [
    "orientation_certified",
    "insurance_verified",
    "medical_cert_valid",
    "ssf_confirmed",
    "shram_received",
    "e_sticker_received",
  ],
  doc_prep: [
    "all_docs_compiled",
    "ticket_ready",
    "briefing_done",
    "docs_handed",
  ],
  departure: ["airport_reported", "flight_departed", "confirmation_received"],
};

export const getChecklistValue = (checklistMap, columnId, itemKey, fallbackDone) => {
  if (!checklistMap) return fallbackDone;
  const mapKey = `${columnId}__${itemKey}`;
  const mapValue = checklistMap[mapKey];
  return typeof mapValue === "boolean" ? mapValue : fallbackDone;
};

export const getChecklistMeta = (checklistMap, columnId, itemKey, fallbackDone) => {
  const done = getChecklistValue(checklistMap, columnId, itemKey, fallbackDone);
  return {
    done,
    autoDone: fallbackDone,
    overridden: done !== fallbackDone,
  };
};
