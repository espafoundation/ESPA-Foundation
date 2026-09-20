import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

const partners = [ "Partner I", "Partner II", "Partner III", "Partner IV", "Partner V", "Partner VI", "Partner VII" ];

export default function Partners() {
  const { t } = useLanguage();

  return (
    <section className="bg-white py-16 md:py-24 overflow-hidden transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 md:px-16 mb-12 md:mb-20 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#003828] transition-colors duration-300">Partners</h2>
      </div>

      <div className="relative w-full flex overflow-x-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20,
          }}
          className="flex whitespace-nowrap items-center gap-8 md:gap-16 px-8 py-4"
        >
          {[...partners, ...partners].map((partner, i) => (
            <div key={i} className="text-4xl md:text-5xl font-display font-bold text-[#003828]/40 transition-colors duration-300 pb-4">
              {partner}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
