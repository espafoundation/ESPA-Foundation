import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
 const { t } = useLanguage();
 const [openIndex, setOpenIndex] = useState<number | null>(null);

 const faqs = [
 { 
 q: 'How is my donation used?', 
 a: 'Your donation is used to build modern, fully-equipped libraries in rural schools, and to provide merit and need-based scholarships. These funds directly construct physical spaces, purchase books, and cover tuition fees for students in the Gilgit-Baltistan region.' 
 },
 { 
 q: 'What percentage of my donation goes directly to programs vs operations?', 
 a: 'We are proud to say that 100% of public donations go directly to funding our libraries and scholarships. Our core operational and administrative costs are covered by private founders and institutional grants.' 
 },
 { 
 q: 'Is my donation tax-deductible?', 
 a: 'Yes. ESPA Foundation is a registered 501(c)(3) non-profit organization (or your local equivalent), making all financial contributions fully tax-deductible to the extent allowed by law. You will automatically receive a tax receipt via email and in your User Dashboard.' 
 },
 { 
 q: 'Can I set up a recurring/monthly donation?', 
 a: 'Absolutely. When making a donation through our portal, simply toggle the "Make this a monthly recurring donation" option. Monthly giving provides us with reliable funding to plan long-term projects.' 
 },
 { 
 q: 'How can I see where my money went?', 
 a: 'We believe in complete transparency. Once you donate, you will gain access to a private User Dashboard where you can view your lifetime giving, track exact fund allocations (e.g., Library vs. Scholarship funds), and read organizational updates showing the impact of your gifts.' 
 },
 { 
 q: 'Can I volunteer with ESPA Foundation?', 
 a: 'Yes! We are always looking for passionate individuals. You can join our on-ground teams in Gilgit for library construction and book drives, or volunteer virtually by mentoring our scholarship students from anywhere in the world.' 
 },
 { 
 q: 'How do you protect the privacy of the children you serve?', 
 a: 'We have strict safeguarding policies. We only share stories and photos of our students with explicit, informed consent from their parents or guardians. In many cases, we change names or obscure identities in public materials to ensure the safety and privacy of minors.' 
 }
 ];

 return (
 <section id="faq" className="bg-white py-16 md:py-24 text-[#003828] transition-colors duration-300">
 <div className="max-w-6xl mx-auto px-4 md:px-16">
 <div className="text-center mb-12 md:mb-20">
 <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-2 md:mb-3">Frequently Asked Questions</h2>
 </div>
 
 <div className="flex flex-col gap-4">
 {faqs.map((faq, i) => (
 <div key={i} className="border-b border-[#003828]/10 overflow-hidden transition-colors duration-300">
 <button 
 onClick={() => setOpenIndex(openIndex === i ? null : i)}
 className="w-full py-6 flex items-center justify-between text-left focus:outline-none cursor-pointer group"
 >
 <span className="font-display text-xl md:text-2xl font-bold pr-8 group-hover:text-[#003828]/80 transition-colors">{faq.q}</span>
 <span className="flex-shrink-0 text-[#003828]/50 group-hover:text-[#003828] transition-colors">
 {openIndex === i ? <Minus size={24} /> : <Plus size={24} />}
 </span>
 </button>
 
 {openIndex === i && (
 <div
 >
 <p className="text-justify pb-4 md:pb-6 font-sans text-lg text-[#003828]/70 transition-colors duration-300">
 {faq.a}
 </p>
 </div>
 )}
 
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
