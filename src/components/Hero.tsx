import { useLanguage } from '../contexts/LanguageContext';
import EditableText from './EditableText';

export default function Hero() {
 const { t } = useLanguage(); 

 return (
   <section className="relative min-h-[70dvh] w-full overflow-hidden bg-white transition-colors duration-500 flex flex-col pt-20 sm:pt-24 pb-16 md:pb-24">
     
     <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 mt-6 sm:mt-8 mb-6 sm:mb-8">
       <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-[#003828] tracking-tight max-w-5xl">
         <EditableText id="hero_title" defaultText={t('hero.title')} as="span" className="whitespace-pre-line" />
       </h1>
       <div className="font-sans mt-6 sm:mt-10 text-base sm:text-lg md:text-xl font-normal text-[#003828]/80 max-w-2xl px-2">
         <EditableText id="hero_subtitle" defaultText={t('hero.subtitle')} as="span" />
       </div>
     </div>
     
     {/* Hidden for now: Stats Section
     <div className="relative w-full px-4 md:px-16">
       <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between md:items-center gap-8 bg-[#003828]/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:px-12 text-[#003828]">
         <div className="flex flex-col items-center text-center">
           <div className="text-4xl font-display font-bold mb-1">0</div>
           <div className="text-xs md:text-sm text-[#003828] uppercase tracking-widest font-bold">{t('hero.stat1')}</div>
         </div>
         <div className="flex flex-col items-center text-center">
           <div className="text-4xl font-display font-bold mb-1">0</div>
           <div className="text-xs md:text-sm text-[#003828] uppercase tracking-widest font-bold">{t('hero.stat2')}</div>
         </div>
         <div className="flex flex-col items-center text-center">
           <div className="text-4xl font-display font-bold mb-1">0</div>
           <div className="text-xs md:text-sm text-[#003828] uppercase tracking-widest font-bold">{t('hero.stat3')}</div>
         </div>
       </div>
     </div>
     */}
     
   </section>
 );
}
