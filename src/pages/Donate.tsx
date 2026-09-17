import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const DetailRow = ({ label, value, subValue, highlight = false }: { label: string, value: string, subValue?: string, highlight?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied!`, {
      style: {
        background: '#004B36',
        color: '#fff',
        borderRadius: '12px'
      }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start justify-between group py-1">
      <div>
        <span className="text-white/60 block text-xs uppercase tracking-wider mb-1 font-medium">{label}</span>
        <span className={`font-medium ${highlight ? 'font-semibold text-xl' : 'text-lg tracking-wide break-all'}`}>{value}</span>
        {subValue && <span className="italic text-white/80 text-sm block mt-1">{subValue}</span>}
      </div>
      <button 
        onClick={handleCopy}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all flex-shrink-0 ml-4 mt-1 active:scale-95"
        title="Copy to clipboard"
      >
        {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
      </button>
    </div>
  );
};

const StripeCheckout = () => {
  const [amount, setAmount] = useState('50');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('[Stripe Checkout] Initiating checkout for amount:', amount);
    
    try {
      console.log('[Stripe Checkout] Sending POST request to /api/create-checkout-session...');
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      
      console.log('[Stripe Checkout] Received response with status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('[Stripe Checkout] Response JSON payload:', data);
      } catch (parseError) {
        console.error('[Stripe Checkout] Failed to parse JSON response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok && data.url) {
        console.log('[Stripe Checkout] Success! Redirecting to Stripe URL:', data.url);
        // If we are in an iframe (like AI Studio preview), Stripe will block it. Open in new tab.
        if (window.top !== window.self) {
          console.log('[Stripe Checkout] Detected iframe environment. Opening in a new tab.');
          window.open(data.url, '_blank');
        } else {
          console.log('[Stripe Checkout] Detected top-level window. Redirecting in same tab.');
          window.location.href = data.url;
        }
        
        // Reset loading state after a short delay so the button doesn't stay stuck
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      } else {
        const errorMessage = data.error || `Server returned status ${response.status}`;
        console.error('[Stripe Checkout] API Error:', errorMessage);
        toast.error(`Payment Initiation Failed: ${errorMessage}`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('[Stripe Checkout] Network or Execution Error:', error);
      toast.error(`Error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-2xl mx-auto mb-16 border border-stone-100"
    >
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-[#004B36]/10 rounded-full flex items-center justify-center">
          <CreditCard className="text-[#004B36] w-8 h-8" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-stone-900 mb-2 text-center">Donate via Credit / Debit Card</h3>
      <p className="text-stone-500 text-center mb-8">Make a quick and secure online donation using Stripe.</p>
      <form onSubmit={handleCheckout} className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div className="relative w-full sm:w-auto">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 font-medium">$</span>
          <input 
            type="number" 
            min="1" 
            step="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full sm:w-48 pl-9 pr-5 py-3.5 rounded-full border border-stone-200 focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] text-stone-900 font-medium text-lg"
            placeholder="Amount"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3.5 bg-[#004B36] text-white font-semibold rounded-full hover:bg-[#003828] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
             'Donate Now'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default function Donate() {
  const location = useLocation();

  useEffect(() => {
    // Debugging check to verify if the VITE_STRIPE_PUBLISHABLE_KEY is loaded correctly by Vite
    // @ts-ignore
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey) {
      console.log('[Stripe Setup] Publishable key found (starts with):', publishableKey.substring(0, 8) + '...');
    } else {
      console.warn('[Stripe Setup] VITE_STRIPE_PUBLISHABLE_KEY is missing or undefined in the environment variables.');
    }

    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      toast.success('Thank you for your generous donation!', { duration: 5000 });
    } else if (params.get('canceled')) {
      toast.error('Donation process was canceled.');
    }
  }, [location]);

  const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="text-center max-w-3xl mx-auto mb-16">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-5xl font-bold text-[#004B36] mb-6 tracking-tight"
      >
        {title}
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-lg text-stone-600 leading-relaxed"
      >
        {subtitle}
      </motion.p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pt-16 md:pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 md:mt-0">
        <SectionHeader 
          title="Make a Donation" 
          subtitle="You can support the ESPA Foundation directly by making a secure online donation or a bank transfer to one of our regional accounts below. Your contribution helps us expand educational access globally."
        />

        <StripeCheckout />

        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-stone-900">Or Donate via Bank Transfer</h3>
          <p className="text-stone-500 mt-2">Select your region below for direct bank transfer details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Canada */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-[#004B36] text-white rounded-3xl p-8 md:p-10 shadow-xl flex flex-col h-full"
          >
            <h3 className="text-2xl font-bold mb-8 border-b border-white/20 pb-4">
              Canadian Donors
            </h3>
            <div className="space-y-4 flex-grow text-[15px]">
              <DetailRow label="Bank Name" value="Citibank NA Canadian Branch" highlight />
              <DetailRow label="Institution Number" value="0328" />
              <DetailRow label="Transit Number" value="20012" />
              <DetailRow label="Account Type" value="Checking" />
              <DetailRow label="Account Number" value="3013202962" />
              <DetailRow label="Beneficiary Name" value="Rameez Taj" subValue="Official Representative" />
            </div>
          </motion.div>

          {/* UK & Europe */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-[#004B36] text-white rounded-3xl p-8 md:p-10 shadow-xl flex flex-col h-full"
          >
            <h3 className="text-2xl font-bold mb-8 border-b border-white/20 pb-4">
              UK & European Donors
            </h3>
            <div className="space-y-4 flex-grow text-[15px]">
              <DetailRow label="Bank Name" value="Citibank" highlight />
              <DetailRow label="Sort Code" value="185008" />
              <DetailRow label="Account Number" value="56255884" />
              <DetailRow label="IBAN" value="GB25CITI18500856255884" />
              <DetailRow label="BIC" value="CITIGB2L" />
              <DetailRow label="Beneficiary Name" value="Rameez Taj" subValue="Official Representative" />
            </div>
          </motion.div>

          {/* USA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-[#004B36] text-white rounded-3xl p-8 md:p-10 shadow-xl flex flex-col h-full"
          >
            <h3 className="text-2xl font-bold mb-8 border-b border-white/20 pb-4">
              US Donors
            </h3>
            <div className="space-y-4 flex-grow text-[15px]">
              <DetailRow label="Bank Name" value="Citibank" highlight />
              <DetailRow label="Routing (ABA)" value="031100209" />
              <DetailRow label="Account Number" value="70582690002604429" />
              <DetailRow label="Account Type" value="Checking" />
              <DetailRow label="SWIFT Code" value="CITIUS33" />
              <DetailRow label="Beneficiary Name" value="Rameez Taj" subValue="Official Representative" />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
