import React, { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import ReCAPTCHA from "react-google-recaptcha";
import { RECAPTCHA_SITE_KEY } from "../config/recaptcha";

export default function ContactUs() {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  return (
    <div className="bg-white min-h-[50vh] flex flex-col items-center justify-center pt-24 pb-16 px-6">
      <Helmet>
        <title>Contact Us | ESPA Foundation</title>
        <meta name="description" content="Contact the ESPA Foundation for inquiries, volunteering, or support." />
        <meta property="og:title" content="Contact Us | ESPA Foundation" />
      </Helmet>
      
      <div className="max-w-2xl w-full text-center">
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#003828] mb-6">Contact Us</h1>
        <p className="font-sans text-xl font-normal text-[#003828]/70 leading-relaxed mb-12">
          Have questions or want to get involved? We'd love to hear from you.
        </p>
        
        <div className="bg-[#003828] p-8 rounded-3xl border border-[#003828]/10 text-left shadow-lg">
          <form className="flex flex-col gap-6" onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const btn = form.querySelector('button[type="submit"]');
            
            const recaptchaToken = recaptchaRef.current?.getValue();
            if (!recaptchaToken) {
              alert("Please verify that you are not a robot.");
              return;
            }

            if (btn) btn.textContent = 'Sending...';
            try {
              const formData = new FormData(form);
              const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  message: formData.get('message'),
                  recaptchaToken
                })
              });

              if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Server connection failed');
              }
              
              form.reset();
              recaptchaRef.current?.reset();
              if (btn) btn.textContent = 'Message Sent Successfully!';
              setTimeout(() => {
                if (btn) btn.textContent = 'Send Message';
              }, 3000);
            } catch (err: any) {
              console.error(err);
              alert(err.message || 'Something went wrong. Please try again.');
              if (btn) btn.textContent = 'Send Message';
              recaptchaRef.current?.reset();
            }
          }}>
            <div>
              <label className="block text-sm font-bold text-white/70 uppercase tracking-wider mb-2">Name</label>
              <input type="text" name="name" required className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/70 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" name="email" required className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors" placeholder="Your Email Address" />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/70 uppercase tracking-wider mb-2">Message</label>
              <textarea name="message" required rows={5} className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors resize-none" placeholder="How can we help?"></textarea>
            </div>
            <div className="flex justify-center my-2">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                theme="dark"
              />
            </div>
            <button type="submit" className="w-full bg-white text-[#003828] border border-white py-4 rounded-full font-bold hover:bg-[#003828] hover:text-white hover:border-[#003828] transition-all mt-2 cursor-pointer shadow-md">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
