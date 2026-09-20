import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export default function GetInvolved() {
  const { t } = useLanguage();
  const cards = [
    { 
      title: t('getInvolved.c2.title'), 
      desc: t('getInvolved.c2.desc'), 
      btn: t('getInvolved.c2.btn'), 
      link: '/volunteer' 
    },
    { 
      title: 'Ambassador', 
      desc: 'Represent ESPA Foundation in your community and help us spread awareness and raise funds.', 
      btn: 'Become an Ambassador', 
      link: '/ambassador' 
    },
    { 
      title: t('getInvolved.c3.title'), 
      desc: t('getInvolved.c3.desc'), 
      btn: t('getInvolved.c3.btn'), 
      link: '/partner' 
    }
  ];

  return (
    <section id="get-involved" className="bg-[#003828] py-16 md:py-24 transition-colors duration-300">
      <div className="max-w-[90rem] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white mb-2 md:mb-3 transition-colors duration-300">{t('getInvolved.title')}</h2>
          <p className="text-justify font-sans text-xl font-normal text-white/70 max-w-3xl mx-auto">{t('getInvolved.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, i) => (
            <div key={i} className="bg-[#00261B] p-8 lg:p-6 xl:p-10 rounded-3xl shadow-sm border border-white/5 flex flex-col h-full overflow-hidden transition-colors duration-300">
              <h3 className="text-center font-display text-xl font-bold mb-4 text-white transition-colors duration-300">{card.title}</h3>
              <p className="text-justify font-sans text-white/70 mb-8 flex-grow text-lg lg:text-base xl:text-lg font-normal transition-colors duration-300">{card.desc}</p>
              <Link 
                to={card.link}
                state={{ fromSection: 'get-involved', scrollY: typeof window !== 'undefined' ? window.scrollY : 0 }}
                onClick={() => {
                  try {
                    sessionStorage.setItem('espa_last_section', 'get-involved');
                    sessionStorage.setItem('espa_last_section_/', 'get-involved');
                    sessionStorage.setItem('espa_scroll_/', window.scrollY.toString());
                  } catch (e) {}
                }}
                className="w-full bg-white text-[#003828] border border-white py-4 px-4 rounded-full font-bold hover:bg-[#003828] hover:text-white hover:border-[#003828] transition-all text-base flex items-center justify-center text-center shadow-sm cursor-pointer"
              >
                {card.btn}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
