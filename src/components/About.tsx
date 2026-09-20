
import EditableText from './EditableText';

export default function About() {
  return (
    <section id="about" className="bg-[#003828] py-16 md:py-24 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 md:px-16">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight">
            <EditableText id="mission_title_new" defaultText="Our Mission" as="span" />
          </h2>
        </div>
        
        <div className="font-sans text-lg md:text-xl font-normal text-white/80 leading-relaxed text-justify flex flex-col gap-8">
          <p>
            <EditableText 
              id="mission_p1_new" 
              defaultText="ESPA Foundation is committed to expanding access to quality education for children in underserved rural and mountainous communities, where limited employment opportunities and financial hardship often prevent families from sending their children to school. In many such communities, children are compelled to contribute to household income through daily wage labour, making education an unaffordable compromise for their families." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="mission_p2_new" 
              defaultText="The Foundation addresses these barriers by providing partial and full educational scholarships to deserving children, enabling them to continue their education regardless of their financial circumstances." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="mission_p3_new" 
              defaultText="Beyond scholarships, ESPA Foundation works to strengthen educational infrastructure in rural communities through book drives and partnerships with libraries and educational institutions. Collected books are used to establish and develop community libraries, creating accessible spaces where children can learn, read, and develop a lasting culture of education." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="mission_p4_new" 
              defaultText="The Foundation also promotes the digital transformation of rural libraries by providing laptops equipped with its own Library Management Tool. This enables libraries to digitally catalogue and manage their collections, reducing dependence on paper-based record-keeping while improving accessibility and efficiency. By encouraging digital library management, ESPA Foundation also seeks to reduce unnecessary paper consumption and its associated environmental impact, particularly in ecologically sensitive mountainous regions." 
              as="span" 
            />
          </p>
          <p>
            <EditableText 
              id="mission_p5_new" 
              defaultText="Through these initiatives, ESPA Foundation strives to remove financial, educational, and infrastructural barriers to learning and create sustainable opportunities for children in communities where access to education remains limited." 
              as="span" 
            />
          </p>
        </div>
      </div>
    </section>
  );
}
