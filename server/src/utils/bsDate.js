import NepaliDate from 'bikram-sambat';

export const adToBS = (adDate) => {
  if (!adDate) return null;
  try {
    const d = adDate instanceof Date ? adDate : new Date(adDate);
    if (isNaN(d.getTime())) return null;
    const nd = new NepaliDate(d);
    return {
      year: nd.getYear(),
      month: nd.getMonth() + 1,
      day: nd.getDate(),
      formatted: `${nd.getYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`,
      display: `${nd.getDate()} ${BS_MONTHS[nd.getMonth()]} ${nd.getYear()}`,
      short: `${nd.getDate()}/${nd.getMonth() + 1}/${nd.getYear()}`
    };
  } catch (e) {
    return null;
  }
};

export const bsToAD = (year, month, day) => {
  try {
    const nd = new NepaliDate(year, month - 1, day);
    return nd.toJsDate();
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

export const isValidBSDate = (year, month, day) => {
  try {
    const nd = new NepaliDate(year, month - 1, day);
    return nd.getYear() === year && nd.getMonth() === month - 1 && nd.getDate() === day;
  } catch (e) {
    return false;
  }
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
  bsDateRangeToAD,
  getBSYearRange,
  isValidBSDate
};