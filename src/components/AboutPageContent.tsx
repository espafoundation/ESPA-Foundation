import React from 'react';
import EditableText from './EditableText';

export default function AboutPageContent() {
  return (
    <section id="about-page-content" className="py-12 md:py-20 bg-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-[#003828] tracking-tight">
            <EditableText id="about_page_title" defaultText="About Us" as="span" />
          </h2>
        </div>
        
        <div className="font-sans text-lg md:text-xl font-normal text-[#003828]/80 leading-relaxed text-justify flex flex-col gap-8">
          <p>
            <EditableText 
              id="about_page_p1" 
              defaultText="ESPA Foundation is an educational non-profit organization dedicated to improving access to knowledge and opportunity for children in the rural communities of northern Pakistan, particularly the Gilgit region. We believe that every child deserves the chance to learn, grow, and dream beyond the limitations of geography and resources." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="about_page_p2" 
              defaultText="In many of these communities, financial hardship and limited local employment often force children into daily wage labour instead of school. We address this through partial and full scholarships that let deserving students continue their studies regardless of their family's circumstances." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="about_page_p3" 
              defaultText="Alongside scholarships, we strengthen local learning infrastructure through book drives and partnerships with schools and libraries. Donated books help establish and grow community libraries — spaces where reading becomes part of everyday life." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="about_page_p4" 
              defaultText="We also support the digital transformation of these libraries by equipping them with laptops running our own Library Management Tool, replacing paper-based cataloguing with a faster, more accessible digital system. This shift also cuts unnecessary paper use, an added benefit in ecologically sensitive mountain regions." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="about_page_p5" 
              defaultText="Together, these initiatives help ESPA Foundation remove the financial and infrastructural obstacles that keep children out of school, building sustainable, accessible paths to learning in the communities that need it most." 
              as="span" 
            />
          </p>
        </div>
      </div>
    </section>
  );
}
