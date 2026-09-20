
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import EditableText from './EditableText';

export default function JoinMission() {
  const { t } = useLanguage();

  return (
    <section id="join-mission" className="bg-white transition-colors duration-300 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto text-center bg-[#003828]/5 rounded-3xl p-6 md:p-12 border border-[#003828]/10">
        <h2 className="font-display text-3xl md:text-5xl font-bold text-[#003828] tracking-tight mb-2 md:mb-3">
          <EditableText id="join_mission_title" defaultText="Join Our Mission" as="span" />
        </h2>
        <div className="font-sans text-lg md:text-xl text-[#003828]/80 mb-10 max-w-2xl mx-auto text-justify">
          <EditableText 
            id="join_mission_desc" 
            defaultText="Interested in volunteering with the ESPA Foundation? We'd love to have you on board to help make education accessible to all." 
            as="span" 
          />
        </div>
        <Link 
          to="/volunteer"
          state={{ fromSection: 'join-mission', scrollY: typeof window !== 'undefined' ? window.scrollY : 0 }}
          onClick={() => {
            try {
              sessionStorage.setItem('espa_last_section', 'join-mission');
              sessionStorage.setItem('espa_last_section_/', 'join-mission');
              sessionStorage.setItem('espa_scroll_/', window.scrollY.toString());
            } catch (e) {}
          }}
          className="inline-block bg-[#003828] text-white border border-[#003828] px-10 py-4 rounded-full font-bold text-sm tracking-wide hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all shadow-sm cursor-pointer"
        >
          Volunteer With Us
        </Link>
      </div>
    </section>
  );
}
