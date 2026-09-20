
import { useLanguage } from '../contexts/LanguageContext';
import EditableText from './EditableText';

export default function Programs() {
 const { t } = useLanguage();

 const programs = [
 {
 title: t('programs.p1.title'),
 desc: t('programs.p1.desc'),
 img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=75&w=1200&auto=format&fit=crop"
 },
 {
 title: t('programs.p2.title'),
 desc: t('programs.p2.desc'),
 img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=75&w=1200&auto=format&fit=crop"
 }
 ];

 return (
 <section id="programs" className="bg-white py-16 md:py-24 transition-colors duration-300">
 <div className="max-w-6xl mx-auto px-4 md:px-16">
 <div className="mb-12 md:mb-20 text-center">
 <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#003828] mb-2 md:mb-3 transition-colors duration-300"><EditableText id="programs_title" defaultText={t('programs.title')} as="span" /></h2>
 <div className="font-sans text-xl font-normal text-[#003828]/70 max-w-3xl mx-auto transition-colors duration-300"><EditableText id="programs_subtitle" defaultText={t('programs.subtitle')} as="span" /></div>
 </div>

 <div className="flex flex-col gap-12 md:gap-20">
 {programs.map((program, idx) => (
          <div key={idx} className={`flex flex-col md:flex-row gap-8 md:gap-16 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className="w-full md:w-1/2 aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-[#003828]/5 transition-all duration-300 relative group cursor-pointer">
              <img 
                src={program.img} 
                alt={program.title} 
                loading="lazy"
                decoding="async"
                width="600"
                height="450"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-[#003828]/0 group-hover:bg-[#003828]/10 transition-colors duration-300"></div>
            </div>
            
            <div className="w-full md:w-1/2">
              <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#003828] transition-colors duration-300">{program.title}</h3>
              <p className="text-justify font-sans text-xl font-normal text-[#003828]/70 leading-relaxed transition-colors duration-300">{program.desc}</p>
            </div>
          </div>
        ))}
 </div>
 </div>
 </section>
 );
}
