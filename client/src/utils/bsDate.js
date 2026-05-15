import * as bsLib from 'bikram-sambat';
const bs = bsLib.default || bsLib;

export const adToBS = (adDate) => {
  if (!adDate) return null;
  try {
    const d = adDate instanceof Date ? adDate : new Date(adDate);
    if (isNaN(d.getTime())) return null;
    
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const nd = bs.toBik(dateString);
    if (!nd) return null;
    
    return {
      year: nd.year,
      month: nd.month,
      day: nd.day,
      formatted: `${nd.year}-${String(nd.month).padStart(2, '0')}-${String(nd.day).padStart(2, '0')}`,
      display: `${nd.day} ${BS_MONTHS[nd.month - 1]} ${nd.year}`,
      short: `${nd.day}/${nd.month}/${nd.year}`
    };
  } catch (e) {
    return null;
  }
};

export const bsToAD = (year, month, day) => {
  try {
    const g = bs.toGreg(year, month, day);
    if (!g) return null;
    return new Date(g.year, g.month - 1, g.day);
  } catch (e) {
    return null;
  }
};

export const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const BS_MONTHS_NEPALI = [
  'वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'अशोज',
  'कात्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
];

export const getCurrentBS = () => {
  return adToBS(new Date());
};

export const formatBSDisplay = (adDate) => {
  if (!adDate) return '—';
  const bs = adToBS(adDate);
  return bs ? bs.display : '—';
};

export const formatBSShort = (adDate) => {
  if (!adDate) return '—';
  const bs = adToBS(adDate);
  return bs ? bs.short : '—';
};

export const formatBSWithAD = (adDate) => {
  if (!adDate) return '—';
  const bs = adToBS(adDate);
  if (!bs) return '—';
  const adStr = adDate instanceof Date ? adDate.toLocaleDateString('en-GB') : new Date(adDate).toLocaleDateString('en-GB');
  return `${bs.display} (${adStr})`;
};

export const formatBSForInput = (adDate) => {
  if (!adDate) return '';
  const bs = adToBS(adDate);
  if (!bs) return '';
  return bs.formatted;
};

export const bsDateRangeToAD = (bsYear, bsMonth) => {
  if (!bsYear || !bsMonth) return null;
  try {
    const start = bsToAD(parseInt(bsYear), parseInt(bsMonth), 1);
    const nextMonth = parseInt(bsMonth) === 12 ? 1 : parseInt(bsMonth) + 1;
    const nextYear = parseInt(bsMonth) === 12 ? parseInt(bsYear) + 1 : parseInt(bsYear);
    const end = bsToAD(nextYear, nextMonth, 1);
    end.setDate(end.getDate() - 1);
    return { start, end };
  } catch (e) {
    return null;
  }
};

export const getBSYearRange = () => {
  const current = getCurrentBS();
  const years = [];
  for (let y = current.year - 5; y <= current.year + 1; y++) {
    years.push(y);
  }
  return years;
};

export const getBSMonthRange = () => {
  return BS_MONTHS.map((month, index) => ({
    value: index + 1,
    label: month,
    labelNepali: BS_MONTHS_NEPALI[index]
  }));
};

export default {
  adToBS,
  bsToAD,
  BS_MONTHS,
  BS_MONTHS_NEPALI,
  getCurrentBS,
  formatBSDisplay,
  formatBSShort,
  formatBSWithAD,
  formatBSForInput,
  bsDateRangeToAD,
  getBSYearRange,
  getBSMonthRange
};