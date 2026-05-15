import { useState, useEffect } from 'react';
import { useFees } from '../hooks/useFees';
import { formatNPR, formatDateNPR } from '../utils/currency';

const formatDateBS = formatDateNPR;

const Finance = () => {
  const { getSummary, getTransactions, transactions, summary, loading } = useFees();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = async () => {
    await getSummary({ year, month });
    await getTransactions({ limit: 20 });
  };

  const months = [
    { value: 1, label: 'Baisakh' },
    { value: 2, label: 'Jestha' },
    { value: 3, label: 'Asarh' },
    { value: 4, label: 'Shrawan' },
    { value: 5, label: 'Bhadra' },
    { value: 6, label: 'Ashwin' },
    { value: 7, label: 'Kartik' },
    { value: 8, label: 'Mangsir' },
    { value: 9, label: 'Poush' },
    { value: 10, label: 'Magh' },
    { value: 11, label: 'Falgun' },
    { value: 12, label: 'Chaitra' }
  ];

  const stats = [
    {
      label: 'Total Revenue',
      value: summary?.totalReceived || 0,
      color: 'green'
    },
    {
      label: 'Expenses',
      value: summary?.totalPaid || 0,
      color: 'red'
    },
    {
      label: 'Outstanding',
      value: summary?.outstanding || 0,
      color: 'orange'
    },
    {
      label: 'Net',
      value: summary?.net || 0,
      color: summary?.net >= 0 ? 'green' : 'red'
    }
  ];

  const barChartData = summary?.monthly || [];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-xl font-semibold ${
              stat.color === 'green' ? 'text-green-600' :
              stat.color === 'red' ? 'text-red-600' :
              stat.color === 'orange' ? 'text-orange-600' : 'text-gray-900'
            }`}>
              {formatNPR(stat.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue (Last 6 Months)</h2>
        {barChartData.length === 0 ? (
          <p className="text-gray-500 text-sm">No data available</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {barChartData.slice(-6).map((item, idx) => {
              const maxReceived = Math.max(...barChartData.map(d => d.received || 0), 1);
              const height = item.received ? (item.received / maxReceived) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-primary-600 rounded-t" style={{ height: `${height}%`, minHeight: item.received ? '4px' : '0' }} />
                  <p className="text-xs text-gray-500 mt-1">{item._id}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <button className="text-sm text-primary-600 hover:text-primary-500">
            Export to Excel
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500">No transactions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 text-gray-500 font-medium">Candidate</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Dir</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Method</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2">{t.candidateId?.fullName || '-'}</td>
                    <td className="py-2 capitalize">{t.transactionType?.replace('_', ' ')}</td>
                    <td className="py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        t.direction === 'received' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className={`py-2 text-right font-medium ${
                      t.direction === 'received' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.direction === 'received' ? '+' : '-'}{formatNPR(t.amountNPR)}
                    </td>
                    <td className="py-2 capitalize">{t.paymentMethod || '-'}</td>
                    <td className="py-2 text-right">{formatDateBS(t.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;