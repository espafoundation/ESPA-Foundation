import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function ServicesPage() {
  const services = [
    {
      id: "pos",
      title: "Point-of-Sale",
      link: "/pos",
      desc: "Our comprehensive Point-of-Sale system designed for efficient management and transactions, tailored for the unique needs of local businesses and rural markets.",
      img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000",
    },
    {
      id: "library",
      title: "Digital Library",
      link: "/library/login",
      desc: "A robust digital library management tool providing laptops and software to digitally catalogue and manage collections in rural communities, reducing paper consumption and enhancing learning opportunities.",
      img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1000",
    },
    {
      id: "portal",
      title: "Alliance Portal",
      link: "/portal",
      desc: "An integrated portal for seamless management of organizational operations, offering transparent resource allocation and streamlined administration.",
      img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
    },
    {
      id: "vcard",
      title: "Virtual Card",
      link: "/vcard/login",
      desc: "Modern digital cards replacing physical paper, reducing waste, and improving connectivity. Connect with community members and partners instantly.",
      img: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=1000",
    },
    {
      id: "signature",
      title: "Digital Signature",
      link: "/signature",
      desc: "Secure digital signature solutions designed to streamline verification and documentation processes across all our educational and operational initiatives.",
      img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Services | ESPA Foundation</title>
        <meta name="description" content="Explore the services provided by ESPA Foundation." />
        <meta property="og:title" content="Services | ESPA Foundation" />
        <meta property="og:description" content="Explore the services provided by ESPA Foundation." />
      </Helmet>

      <div className="pt-24 pb-12 bg-white text-center px-4">
         <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#003828]">Our Services</h1>
      </div>

      <div className="flex flex-col">
        {services.map((service, idx) => {
          const isGreenBg = idx % 2 !== 0; 
          const bgColor = isGreenBg ? 'bg-[#003828]' : 'bg-white';
          const textColor = isGreenBg ? 'text-white' : 'text-[#003828]';
          const descColor = isGreenBg ? 'text-white/80' : 'text-[#003828]/70';
          const isReversed = idx % 2 !== 0;

          return (
            <section key={idx} className={`${bgColor} py-16 md:py-24 transition-colors duration-300`}>
              <div className="max-w-6xl mx-auto px-4 md:px-16 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                
                {/* Image */}
                <div className={`w-full md:w-1/2 aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ${isGreenBg ? 'bg-black/20' : 'bg-[#003828]/5'} transition-all duration-300 relative group cursor-pointer ${isReversed ? 'md:order-2' : ''}`}>
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                
                {/* Text */}
                <div className={`w-full md:w-1/2 ${isReversed ? 'md:order-1 text-left' : 'text-left'}`}>
                  <Link to={service.link} className="inline-block hover:opacity-80 transition-opacity">
                    <h2 className={`font-display text-3xl md:text-4xl font-bold tracking-tight mb-4 ${textColor}`}>
                      {service.title}
                    </h2>
                  </Link>
                  <p className={`font-sans text-xl font-normal leading-relaxed text-justify ${descColor}`}>
                    {service.desc}
                  </p>
                </div>

              </div>
            </section>
          )
        })}
      </div>
    </div>
  );
}
