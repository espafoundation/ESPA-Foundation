import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';


import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="w-full bg-white flex flex-col">
      <Helmet>
        <title>PrivacyPolicy | ESPA Foundation</title>
        <meta name="description" content="PrivacyPolicy for ESPA Foundation." />
      </Helmet>
      
      
      <main className="flex-1 pt-32 pb-24 px-6 md:px-8">
        <div className="max-w-4xl mx-auto prose prose-neutral prose-green">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-[#003828] mb-8">Privacy Policy</h1>
          
          <div className="text-[#003828]/80 space-y-6">
            <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">1. Introduction</h2>
              <p>Welcome to the ESPA Foundation ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">2. Information We Collect</h2>
              <p>We may collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and services, when you participate in activities on the Website or otherwise contact us.</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Name and Contact Data (such as email address)</li>
                <li>Credentials (such as passwords for our digital library and management portals)</li>
                <li>Usage Data and Analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">3. How We Use Your Information</h2>
              <p>We use personal information collected via our Website for a variety of business purposes described below:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>To facilitate account creation and logon process</li>
                <li>To send administrative information to you</li>
                <li>To protect our Services</li>
                <li>To respond to user inquiries/offer support to users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#003828] mt-8 mb-4">4. Contact Us</h2>
              <p>If you have questions or comments about this policy, you may email us at <a href="mailto:espafoundation@outlook.com" className="text-[#003828] font-medium hover:underline">espafoundation@outlook.com</a> or by post to:</p>
              <p className="mt-2">
                ESPA Foundation<br/>
                A-36, CS-58, Bhai Jan Chowk,<br/>
                Aisha Manzil, FB Area
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
