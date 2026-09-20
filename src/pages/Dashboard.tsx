import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { getEditHistory, HistoryRecord } from '../lib/history';
import { History, Clock, Copy, Check, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Download, LayoutDashboard, FileText, Activity, User, LogOut, MapPin, ExternalLink, TrendingUp, BookOpen, GraduationCap, Search, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const donationData = [
 { date: '2023-11-15', amount: 5000, category: 'Library Fund', id: 'RCPT-8273' },
 { date: '2023-08-02', amount: 2500, category: 'Scholarship Fund', id: 'RCPT-7192' },
 { date: '2023-01-20', amount: 10000, category: 'General Fund', id: 'RCPT-6011' },
];

const totalGiven = donationData.reduce((acc, curr) => acc + curr.amount, 0);

const impactData = [
 { name: 'Library Fund', value: 5000, color: '#0ea5e9' },
 { name: 'Scholarship Fund', value: 2500, color: '#f59e0b' },
 { name: 'General Fund', value: 10000, color: '#10b981' },
];

const updates = [
 { date: '2023-12-01', title: 'New Libraries Operational', content: 'Thanks to your support, 5 new libraries have been inaugurated in the northern districts.', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=300&auto=format&fit=crop' },
 { date: '2023-10-15', title: 'Q3 Financial Audit', content: 'Our independent quarterly audit has been completed and certified by external partners.', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300&auto=format&fit=crop' }
];

const stories = [
 {
 name: "Amina, 12",
 role: "Student, Gilgit",
 text: "Having a library in our village means I can finally read books about science and space. I want to be an astronaut one day and explore the universe.",
 img: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=400&auto=format&fit=crop"
 },
 {
 name: "Mr. Tariq",
 role: "Teacher, Skardu",
 text: "The new curriculum tools provided by the scholarship fund have completely transformed how our students engage with mathematics. Attendance is up 40%.",
 img: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop"
 },
 {
 name: "Fatima, 16",
 role: "Scholarship Recipient, Lahore",
 text: "Without the foundation's support, I would have had to leave school to work. Now, I am top of my class and applying for university.",
 img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop"
 }
];

const CustomTooltip = ({ active, payload }: any) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 const percent = ((data.value / totalGiven) * 100).toFixed(0);
 return (
    <div className="bg-white p-3 rounded-xl shadow-lg border border-[#003828]/5 ">
      <Helmet>
        <title>Dashboard | ESPA Foundation</title>
        <meta name="description" content="Dashboard for ESPA Foundation." />
      </Helmet>
 <p className="font-bold text-[#003828] ">{data.name}</p>
 <p className="text-sm text-[#003828]/70 ">${data.value.toLocaleString()} — {percent}%</p>
 </div>
 );
 }
 return null;
};

export default function Dashboard() {
 const { isAuthenticated, user, logout } = useAuth();
 const navigate = useNavigate();
 const [searchQuery, setSearchQuery] = useState('');
 const [storyIndex, setStoryIndex] = useState(0);
 const [history, setHistory] = useState<HistoryRecord[]>([]);
 const [profileCopied, setProfileCopied] = useState(false);

 const handleCopyProfileLink = () => {
  const profileSlug = user?.id || user?.username || (user?.name ? user.name.toLowerCase().replace(/\s+/g, '-') : 'profile');
  const profileUrl = `${window.location.origin}/profile/${profileSlug}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
   navigator.clipboard.writeText(profileUrl)
    .then(() => {
     setProfileCopied(true);
     toast.success('Profile link copied to clipboard!');
     setTimeout(() => setProfileCopied(false), 2500);
    })
    .catch(() => {
     fallbackCopy(profileUrl);
    });
  } else {
   fallbackCopy(profileUrl);
  }
 };

 const fallbackCopy = (text: string) => {
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
  setProfileCopied(true);
  toast.success('Profile link copied to clipboard!');
  setTimeout(() => setProfileCopied(false), 2500);
 };
 useEffect(() => {
 if (user?.role === 'admin') {
 setHistory(getEditHistory());
 }
 }, [user]);

 useEffect(() => {
 if (!isAuthenticated) {
 navigate('/login');
 } else if (user?.role === 'libraryAdmin' || user?.role === 'libraryReader') {
 navigate('/library/dashboard');
 }
 }, [isAuthenticated, navigate, user]);

 if (!isAuthenticated) return null;

 const filteredDonations = donationData.filter(d => 
 d.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
 d.date.includes(searchQuery) ||
 d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
 d.amount.toString().includes(searchQuery)
 );

 const filteredUpdates = updates.filter(u => 
 u.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
 u.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
 u.date.includes(searchQuery)
 );

 const nextStory = () => setStoryIndex((prev) => (prev + 1) % stories.length);
 const prevStory = () => setStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);

 const exportCSV = () => {
 const headers = ['Date', 'Fund Category', 'Amount', 'Receipt ID'];
 const rows = filteredDonations.map(d => `${d.date},${d.category},${d.amount},${d.id}`);
 const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement("a");
 link.setAttribute("href", encodedUri);
 link.setAttribute("download", "ESPA_Foundation_Donations.csv");
 document.body.appendChild(link);
 link.click();
 link.remove();
 };

 return (
 <div className="w-full text-[#003828] transition-colors duration-300 font-sans">
 
 
 <div className="pt-24 max-w-7xl mx-auto px-6 pb-20 flex flex-col md:flex-row gap-8">
 
 {/* Sidebar */}
 <aside className="w-full md:w-64 shrink-0">
 <div
 className="bg-white rounded-3xl p-6 shadow-sm border border-[#003828]/10 sticky top-32"
 >
 <div className="flex items-center gap-4 mb-4">
 <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center font-bold text-xl">
 {user?.name?.charAt(0) || 'D'}
 </div>
 <div>
 <h3 className="font-bold text-base">{user?.name}</h3>
 <p className="text-xs text-[#003828]/60">{user?.email}</p>
 </div>
 </div>

 <button
   onClick={handleCopyProfileLink}
   className="w-full mb-6 py-2 px-3 bg-[#003828]/5 hover:bg-[#003828]/10 text-[#003828] border border-[#003828]/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
   title="Copy your public profile link"
 >
   {profileCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
   <span>{profileCopied ? 'Profile Link Copied!' : 'Copy Profile Link'}</span>
 </button>
 
 <nav className="flex flex-col gap-2">
 <a href="#overview" className="flex items-center gap-3 px-4 py-3 bg-[#003828]/5 text-indigo-700 border-l-4 border-indigo-600 rounded-r-xl font-medium transition-colors">
 <LayoutDashboard size={18} /> Overview
 </a>
 <a href="#donations" className="flex items-center gap-3 px-4 py-3 hover:bg-white :bg-[#00261B]/50 rounded-full font-medium text-[#003828]/70 transition-colors">
 <FileText size={18} /> My Donations
 </a>
 <a href="#impact" className="flex items-center gap-3 px-4 py-3 hover:bg-white :bg-[#00261B]/50 rounded-full font-medium text-[#003828]/70 transition-colors">
 <Activity size={18} /> My Impact
 </a>
 <a href="#profile" className="flex items-center gap-3 px-4 py-3 hover:bg-white :bg-[#00261B]/50 rounded-full font-medium text-[#003828]/70 transition-colors">
 <User size={18} /> Profile
 </a>
 <button 
 onClick={logout}
 className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 :bg-red-900/20 hover:text-red-600 :text-red-400 rounded-full font-medium text-[#003828]/70 transition-colors text-left mt-4"
 >
 <LogOut size={18} /> Logout
 </button>
 </nav>
 </div>
 </aside>

 {/* Main Content */}
 <main className="flex-grow flex flex-col gap-8">
 
 <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 {/* Welcome Banner */}
 <div
 className="bg-indigo-900 text-white rounded-3xl p-8 shadow-sm border border-indigo-800 flex-grow w-full"
 >
 <h1 className="font-display text-2xl font-bold mb-1">Welcome back, {user?.name.split(' ')[0]}</h1>
 <p className="text-indigo-200 text-sm max-w-xl">
 Your continued support is transforming communities. You have exclusive access to your giving history and organizational impact reports.
 </p>
 </div>

 {/* Search Bar */}
 <div
 className="w-full xl:w-72 shrink-0 relative"
 >
 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003828]/50" />
 <input 
 type="text" 
 placeholder="Search records..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-[#003828]/10 focus:outline-none focus:border-[#003828] transition-colors text-sm font-medium"
 />
 </div>
 </div>

 {/* Top-line Metrics */}
 <div
 className="grid grid-cols-1 md:grid-cols-3 gap-6"
 >
 <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#003828]/10 flex items-center gap-4 hover:shadow-md transition-shadow">
 <div className="w-12 h-12 bg-[#003828]/10 text-[#003828] rounded-full flex items-center justify-center shrink-0">
 <TrendingUp size={24} />
 </div>
 <div>
 <p className="text-sm font-medium text-[#003828]/60">Lifetime Giving</p>
 <h3 className="text-2xl font-display font-bold">${totalGiven.toLocaleString()}</h3>
 </div>
 </div>
 <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#003828]/10 flex items-center gap-4 hover:shadow-md transition-shadow">
 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
 <BookOpen size={24} />
 </div>
 <div>
 <p className="text-sm font-medium text-[#003828]/60">Libraries Funded</p>
 <h3 className="text-2xl font-display font-bold">5</h3>
 </div>
 </div>
 <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#003828]/10 flex items-center gap-4 hover:shadow-md transition-shadow">
 <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
 <GraduationCap size={24} />
 </div>
 <div>
 <p className="text-sm font-medium text-[#003828]/60">Active Scholarships</p>
 <h3 className="text-2xl font-display font-bold">12</h3>
 </div>
 </div>
 </div>

 {/* Activity Notification */}
 <div
 className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-center gap-4 text-sky-800 "
 >
 <MapPin size={20} className="shrink-0" />
 <div className="text-sm">
 <span className="font-bold mr-2">Recent NGO Activity:</span> 
 New library project initiated in Gilgit region following successful fund allocation.
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* Impact Chart */}
 <div
 className="bg-white rounded-3xl p-8 shadow-sm border border-[#003828]/10 "
 >
 <h2 className="font-display text-2xl font-bold mb-2">Fund Allocation</h2>
 <p className="text-sm text-[#003828]/60 mb-6">Breakdown of your contributions by category.</p>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={impactData}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={80}
 paddingAngle={5}
 dataKey="value"
 animationBegin={800}
 animationDuration={1500}
 >
 {impactData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip content={<CustomTooltip />} />
 <Legend verticalAlign="bottom" height={36} iconType="circle" />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Org Updates */}
 <div
 className="bg-white rounded-3xl p-8 shadow-sm border border-[#003828]/10 flex flex-col"
 >
 <div className="flex justify-between items-end mb-6">
 <div>
 <h2 className="font-display text-2xl font-bold mb-2">Organizational Updates</h2>
 <p className="text-sm text-[#003828]/60">Latest news and impact reports.</p>
 </div>
 </div>
 
 <div className="flex flex-col gap-6 flex-grow">
 {filteredUpdates.length > 0 ? filteredUpdates.map((update, i) => (
 <div
 key={i} 
 className="flex gap-4 items-start group"
 >
 <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#003828]/10 ">
 <img src={update.img} alt={update.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
 </div>
 <div>
 <span className="text-xs font-bold text-[#003828]/50 uppercase tracking-wider">{update.date}</span>
 <h4 className="font-bold text-base mt-1 mb-1">{update.title}</h4>
 <p className="text-[#003828]/70 text-sm leading-relaxed">{update.content}</p>
 </div>
 </div>
 )) : (
 <div className="text-center py-8 text-[#003828]/50">No updates found for "{searchQuery}"</div>
 )}
 </div>
 
 <button className="mt-6 text-sm font-bold text-[#003828] hover:text-[#003828] :text-indigo-300 transition-colors flex items-center gap-2">
 View All Updates <ExternalLink size={14} />
 </button>
 </div>

 </div>

 {/* Stories from the field (Carousel) */}
 <div
 className="bg-white rounded-3xl p-8 shadow-sm border border-[#003828]/10 overflow-hidden relative"
 >
 <div className="absolute top-0 right-0 p-8 text-neutral-100 ">
 <Quote size={120} className="opacity-50" />
 </div>
 
 <h2 className="font-display text-2xl font-bold mb-2 relative z-10">Stories from the Field</h2>
 <p className="text-sm text-[#003828]/60 mb-8 relative z-10">Hear directly from those impacted by your generosity.</p>
 
 <div className="relative z-10">
 
 <div
 key={storyIndex}
 className="flex flex-col md:flex-row gap-8 items-center"
 >
 <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden shrink-0 border-4 border-[#003828]/5 ">
 <img src={stories[storyIndex].img} alt={stories[storyIndex].name} className="w-full h-full object-cover" />
 </div>
 <div>
 <p className="text-xl md:text-2xl font-serif italic text-[#003828]/80 mb-6 leading-relaxed">
 "{stories[storyIndex].text}"
 </p>
 <div>
 <h4 className="font-bold text-lg">{stories[storyIndex].name}</h4>
 <p className="text-[#003828] font-medium">{stories[storyIndex].role}</p>
 </div>
 </div>
 </div>
 
 </div>
 
 <div className="flex justify-end gap-3 mt-6 relative z-10">
 <button 
 onClick={prevStory}
 className="w-10 h-10 rounded-full border border-[#003828]/10 flex items-center justify-center hover:bg-white :bg-[#00261B] transition-colors"
 >
 <ChevronLeft size={18} />
 </button>
 <button 
 onClick={nextStory}
 className="w-10 h-10 rounded-full border border-[#003828]/10 flex items-center justify-center hover:bg-white :bg-[#00261B] transition-colors"
 >
 <ChevronRight size={18} />
 </button>
 </div>
 </div>

 
 {user?.role === 'admin' && (
 <div
 className="bg-white rounded-3xl p-8 shadow-sm border border-[#003828]/10 col-span-1 lg:col-span-2"
 >
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="font-display text-2xl font-bold flex items-center gap-2">
 <History className="text-indigo-500" /> Content History
 </h2>
 <p className="text-sm text-[#003828]/60">Track changes made by administrators.</p>
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-[#003828]/10 ">
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Time</th>
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Admin</th>
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Type</th>
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Field ID</th>
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Change</th>
 </tr>
 </thead>
 <tbody>
 {history.length > 0 ? history.slice(0, 10).map((record) => (
 <tr key={record.id} className="border-b border-[#003828]/5 last:border-0 hover:bg-white :bg-[#00261B]/30 transition-colors">
 <td className="py-4 font-medium px-2 text-sm">
 <div className="flex items-center gap-1 text-[#003828]/60">
 <Clock size={12} /> {new Date(record.timestamp).toLocaleString()}
 </div>
 </td>
 <td className="py-4 text-sm font-medium px-2">{record.user}</td>
 <td className="py-4 px-2">
 <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${record.type === 'text' ? 'bg-blue-100 text-blue-700 ' : 'bg-purple-100 text-purple-700 '}`}>
 {record.type}
 </span>
 </td>
 <td className="py-4 text-sm text-[#003828]/70 px-2 font-mono">{record.fieldId}</td>
 <td className="py-4 text-sm px-2 max-w-xs truncate">
 <span className="line-through text-[#003828]/50 mr-2">{record.type === 'text' ? record.oldValue : 'Old Image'}</span>
 <span className="text-green-600 ">{record.type === 'text' ? record.newValue : 'New Image'}</span>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="py-8 text-center text-[#003828]/50">
 No recent content changes.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Donations Table */}
 <div
 className="bg-white rounded-3xl p-8 shadow-sm border border-[#003828]/10 "
 >
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
 <div>
 <h2 className="font-display text-2xl font-bold mb-2">My Donations</h2>
 <p className="text-sm text-[#003828]/60">View and download your official tax receipts.</p>
 </div>
 
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-[#003828]/10 ">
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Date</th>
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Fund</th>
 <th className="pb-4 font-semibold text-sm text-[#003828]/60">Amount</th>
 <th className="pb-4 font-semibold text-sm text-[#003828]/60 text-right">Receipt</th>
 </tr>
 </thead>
 <tbody>
 {filteredDonations.length > 0 ? filteredDonations.map((donation, i) => (
 <tr key={i} className="border-b border-[#003828]/5 last:border-0 hover:bg-white :bg-[#00261B]/30 transition-colors">
 <td className="py-4 font-medium px-2">{donation.date}</td>
 <td className="py-4 text-[#003828]/70 px-2">{donation.category}</td>
 <td className="py-4 font-bold px-2">${donation.amount.toLocaleString()}</td>
 <td className="py-4 text-right px-2">
 <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#003828]/10 hover:bg-white :bg-[#00261B] rounded-full text-sm font-medium transition-colors shadow-sm">
 <Download size={14} /> PDF
 </button>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={4} className="py-8 text-center text-[#003828]/50">
 No donations found for "{searchQuery}"
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </main>
 </div>
 </div>
 );
}
