import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';


import Footer from '../components/Footer';

export default function TermsOfService() {
  return (
    <div className="w-full bg-white flex flex-col">
      <Helmet>
        <title>TermsOfService | ESPA Foundation</title>
        <meta name="description" content="TermsOfService for ESPA Foundation." />
      </Helmet>
      
      
      <main className="flex-1 pt-32 pb-24 px-6 md:px-8">
        <div className="max-w-4xl mx-auto prose prose-neutral prose-green">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-[#003828] mb-8">Terms of Service</h1>
          
          <div className="text-[#003828]/80 space-y-6">
            <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">1. Agreement to Terms</h2>
              <p>By accessing our website and using our digital services (including the Management Portal, Digital Library, POS, and Virtual Card services), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our services.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">2. Use of Services</h2>
              <p>You agree to use our services only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website. Prohibited behavior includes harassing or causing distress or inconvenience to any person, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">3. User Accounts</h2>
              <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
              <p className="mt-2">You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">4. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are and will remain the exclusive property of ESPA Foundation and its licensors. The Service is protected by copyright, trademark, and other laws.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">5. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at <a href="mailto:espafoundation@outlook.com" className="text-[#003828] font-medium hover:underline">espafoundation@outlook.com</a>.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
