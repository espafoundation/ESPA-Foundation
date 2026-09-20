import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DonationTrendsChart({ transactions = [] }) {
  const chartData = useMemo(() => {
    const data = {};
    transactions.forEach(t => {
      if (t.type === 'donation') {
        const date = new Date(t.date || t.timestamp || Date.now());
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!data[monthYear]) data[monthYear] = { name: monthYear, pkr: 0, usd: 0 };
        if (t.currency === 'PKR') data[monthYear].pkr += t.amount;
        if (t.currency === 'USD') data[monthYear].usd += t.amount;
      }
    });
    return Object.values(data);
  }, [transactions]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm mt-8">
      <h2 className="text-xl font-bold text-stone-900 mb-6">Monthly Donation Trends</h2>
      <div className="h-80 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPkr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003828" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#003828" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#008080" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#008080" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} dx={-10} tickFormatter={value => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} dx={10} tickFormatter={value => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value, name) => [name === 'PKR' ? `PKR ${(value || 0).toLocaleString()}` : `$${(value || 0).toLocaleString()}`, name === 'PKR' ? 'PKR Donations' : 'USD Donations']}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Area yAxisId="left" type="monotone" dataKey="pkr" name="PKR" stroke="#003828" strokeWidth={2} fillOpacity={1} fill="url(#colorPkr)" />
              <Area yAxisId="right" type="monotone" dataKey="usd" name="USD" stroke="#008080" strokeWidth={2} fillOpacity={1} fill="url(#colorUsd)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-400 font-medium">No donation data available</div>
        )}
      </div>
    </div>
  );
}
