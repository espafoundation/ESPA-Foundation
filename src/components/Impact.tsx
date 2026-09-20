import { useLanguage } from '../contexts/LanguageContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useState } from 'react';

const data = [
  { year: '2020', libraries: 1, scholarships: 15 },
  { year: '2021', libraries: 3, scholarships: 40 },
  { year: '2022', libraries: 6, scholarships: 90 },
  { year: '2023', libraries: 9, scholarships: 150 },
  { year: '2024', libraries: 12, scholarships: 250 },
];

export default function Impact() {
  const { t } = useLanguage();
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const photos = [
    "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?auto=format&fit=crop&q=80&w=2942",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=2974",
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&q=80&w=2940",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=3032"
  ];

  return (
    <section id="impact" className="bg-white text-[#003828] transition-colors duration-300 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div>
          <div className="text-center mb-12 md:mb-20">
            <h3 className="font-display text-lg font-bold mb-2 md:mb-3">Glimpses of Impact</h3>
            <p className="text-[#003828]/70 ">Real stories from the classrooms we've helped build.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {photos.map((src, i) => (
              <div
                key={src}
                onClick={() => setSelectedImg(src)}
                className="aspect-square rounded-2xl overflow-hidden cursor-pointer bg-[#00261B]"
              >
                <img
                  src={src}
                  alt="Impact"
                  className="w-full h-full object-cover hover:scale-105 hover:opacity-80 transition-all duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedImg && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#003828]/90 backdrop-blur-sm cursor-pointer"
          onClick={() => setSelectedImg(null)}
        >
          <img 
            src={selectedImg} 
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            className="absolute top-6 right-6 md:top-8 md:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
            onClick={() => setSelectedImg(null)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
    </section>
  );
}
