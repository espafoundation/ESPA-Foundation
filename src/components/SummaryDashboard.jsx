import React, { useMemo } from 'react';
import { LayoutDashboard, Wallet, ArrowRightLeft } from 'lucide-react';
import DonationTrendsChart from './DonationTrendsChart';


export default function SummaryDashboard({ funds, currentUser }) {
  const mgmtRoles = ['Admin', 'President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Treasurer', 'Executive Member'];
  const isAdmin = mgmtRoles.includes(currentUser?.role);

  if (!isAdmin) {
    return (
      <div className="space-y-8 h-full flex flex-col tracking-tight relative overflow-y-auto">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">
            Dashboard
          </h1>
          <p className="text-stone-500 text-base mt-2 font-medium">Welcome to your personal dashboard.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm">
          <h2 className="text-xl font-bold text-stone-900 mb-2">My Profile Summary</h2>
          <p className="text-stone-600">Name: <span className="font-semibold text-stone-800">{currentUser?.name}</span></p>
          <p className="text-stone-600">Email: <span className="font-semibold text-stone-800">{currentUser?.email}</span></p>
          <p className="text-stone-600">Role: <span className="font-semibold text-stone-800">{currentUser?.role}</span></p>
        </div>
      </div>
    );
  }

  const totalDonationsPKR = funds.transactions.filter(t => t.type === 'donation' && t.currency === 'PKR').reduce((sum, t) => sum + t.amount, 0);
  const totalDonationsUSD = funds.transactions.filter(t => t.type === 'donation' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
  const totalAllocationsPKR = funds.transactions.filter(t => t.type === 'allocation' && t.currency === 'PKR').reduce((sum, t) => sum + t.amount, 0);

  const chartData = useMemo(() => {
    const data = {};
    funds.transactions.forEach(t => {
      if (t.type === 'donation') {
        const date = new Date(t.date || t.timestamp || Date.now());
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!data[monthYear]) data[monthYear] = { name: monthYear, pkr: 0, usd: 0 };
        if (t.currency === 'PKR') data[monthYear].pkr += t.amount;
        if (t.currency === 'USD') data[monthYear].usd += t.amount;
      }
    });
    return Object.values(data);
  }, [funds.transactions]);

  const totalAllocationsUSD = funds.transactions.filter(t => t.type === 'allocation' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 h-full flex flex-col tracking-tight relative overflow-y-auto">
      <div>
        <h1 className="text-3xl font-semibold text-black flex items-center gap-2">
          Dashboard
        </h1>
        <p className="text-stone-500 text-base mt-2 font-medium">Overview of funds and allocations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <Wallet size={32} className="text-[#004B36] mb-4" />
          <h2 className="text-xl font-bold text-stone-500 mb-2">Current Funds (PKR)</h2>
          <div className="text-4xl font-bold text-stone-900">PKR {(funds?.pkr || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <Wallet size={32} className="text-[#004B36] mb-4" />
          <h2 className="text-xl font-bold text-stone-500 mb-2">Current Funds (USD)</h2>
          <div className="text-4xl font-bold text-stone-900">${(funds?.usd || 0).toLocaleString()}</div>
        </div>
        
        <div className="bg-stone-50 rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2"><ArrowRightLeft size={20} className="text-stone-400" /> Total Donations</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">PKR</span>
              <span className="text-stone-900 font-bold">PKR {(totalDonationsPKR || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">USD</span>
              <span className="text-stone-900 font-bold">${(totalDonationsUSD || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-stone-50 rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2"><ArrowRightLeft size={20} className="text-stone-400" /> Total Allocations</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">PKR</span>
              <span className="text-stone-900 font-bold">PKR {(totalAllocationsPKR || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">USD</span>
              <span className="text-stone-900 font-bold">${(totalAllocationsUSD || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <DonationTrendsChart transactions={funds.transactions} />
    </div>
  );
}
