import { useState, useEffect } from 'react';
import { adToBS, bsToAD, BS_MONTHS, getCurrentBS, getBSYearRange } from '../../utils/bsDate.js';

const BSDatePicker = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  required = false,
  disabled = false,
  className = ''
}) => {
  const currentBS = getCurrentBS();
  const years = getBSYearRange();

  const [bsYear, setBsYear] = useState(value ? adToBS(value)?.year : currentBS.year);
  const [bsMonth, setBsMonth] = useState(value ? adToBS(value)?.month : currentBS.month);
  const [bsDay, setBsDay] = useState(value ? adToBS(value)?.day : currentBS.day);

  useEffect(() => {
    if (value) {
      const bs = adToBS(value);
      if (bs) {
        setBsYear(bs.year);
        setBsMonth(bs.month);
        setBsDay(bs.day);
      }
    }
  }, [value]);

  const handleChange = () => {
    if (bsYear && bsMonth && bsDay) {
      const adDate = bsToAD(bsYear, bsMonth, bsDay);
      if (adDate && !isNaN(adDate.getTime())) {
        onChange(adDate);
      }
    }
  };

  const getDaysInMonth = (year, month) => {
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month + 1, 1);
    end.setDate(end.getDate() - 1);
    return end.getDate();
  };

  const daysInMonth = bsYear && bsMonth ? getDaysInMonth(bsYear, bsMonth) : 32;
  const days = Array.from({ length: Math.min(daysInMonth, 32) }, (_, i) => i + 1);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={bsDay || ''}
          onChange={(e) => {
            setBsDay(parseInt(e.target.value));
            setTimeout(handleChange, 0);
          }}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Day</option>
          {days.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={bsMonth || ''}
          onChange={(e) => {
            setBsMonth(parseInt(e.target.value));
            setBsDay(1);
            setTimeout(handleChange, 0);
          }}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
        >
          <option value="">Month</option>
          {BS_MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>

        <select
          value={bsYear || ''}
          onChange={(e) => {
            setBsYear(parseInt(e.target.value));
            setTimeout(handleChange, 0);
          }}
          disabled={disabled}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
        >
          <option value="">Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {value && (
        <p className="mt-1 text-xs text-gray-500">
          AD: {value instanceof Date ? value.toLocaleDateString('en-GB') : new Date(value).toLocaleDateString('en-GB')}
        </p>
      )}
    </div>
  );
};

export default BSDatePicker;