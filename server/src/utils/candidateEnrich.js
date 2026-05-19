import Medical from "../models/Medical.js";
import Orientation from "../models/Orientation.js";
import InsuranceSsf from "../models/InsuranceSsf.js";

export const enrichWithCompliance = async (candidates) => {
  if (!candidates.length) return candidates;
  const ids = candidates.map((c) => c._id);
  const [medicals, orientations, insuranceSsfs] = await Promise.all([
    Medical.find({ candidateId: { $in: ids } }, "candidateId result").lean(),
    Orientation.find(
      { candidateId: { $in: ids } },
      "candidateId completionStatus",
    ).lean(),
    InsuranceSsf.find(
      { candidateId: { $in: ids } },
      "candidateId insurancePaidDate insurancePolicyNumber ssfPaidDate ssfRegistrationNumber welfareFundPaid",
    ).lean(),
  ]);
  const medMap = {},
    oriMap = {},
    insMap = {};
  for (const m of medicals) medMap[m.candidateId.toString()] = m;
  for (const o of orientations) oriMap[o.candidateId.toString()] = o;
  for (const i of insuranceSsfs) insMap[i.candidateId.toString()] = i;
  return candidates.map((c) => {
    const cid = c._id.toString();
    const ins = insMap[cid];
    return {
      ...c,
      compliance: {
        medical: medMap[cid]?.result === "fit",
        orientation: oriMap[cid]?.completionStatus === "completed",
        insurance: !!(ins?.insurancePaidDate && ins?.insurancePolicyNumber),
        ssf: !!(ins?.ssfPaidDate && ins?.ssfRegistrationNumber),
        welfare: ins?.welfareFundPaid === true,
      },
    };
  });
};

export const addDaysSinceRegistered = (c) => ({
  ...c,
  daysSinceRegistered: Math.floor(
    (Date.now() - new Date(c.registeredAt || c.createdAt)) /
      (1000 * 60 * 60 * 24),
  ),
});
