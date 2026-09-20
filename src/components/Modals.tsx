import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

function DonationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [amount, setAmount] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setAmount('');
        setSubmitted(false);
      }, 300);
    }
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-[#003828]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div 
            className="relative w-full max-w-[500px] h-[500px] max-h-[90vh] bg-white rounded-3xl overflow-y-auto shadow-2xl border border-[#003828]/5 flex flex-col"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-[#003828]/50 hover:text-[#003828] transition-colors z-10">
              <X size={20} />
            </button>
            <div className="p-8 md:p-10 flex flex-col flex-1">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#003828] text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2 text-[#003828]">Thank You!</h3>
                  <p className="text-[#003828]/60 mb-8">Your contribution makes a difference.</p>
                  <button onClick={onClose} className="w-full bg-[#003828] text-white py-4 rounded-full font-bold border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2 text-[#003828]">Make a Donation</h2>
                  <p className="text-[#003828]/60 text-sm mb-2">Support our mission to empower communities.</p>
                  <p className="text-[#003828]/80 text-xs font-semibold mb-8 p-3 bg-[#003828]/5 rounded-lg border border-[#003828]/10">
                    ESPA Foundation is a registered tax-exempt non-profit organization. All donations are tax-deductible.
                  </p>
                  <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); toast.success('Donation processed!'); }} className="flex flex-col gap-6 flex-1">
                    <div className="grid grid-cols-3 gap-3">
                      {['25', '50', '100'].map(val => (
                        <button 
                          type="button" 
                          key={val} 
                          onClick={() => setAmount(val)} 
                          className={`py-3 rounded-full border font-bold transition-all ${amount === val ? 'bg-[#003828] text-white border-[#003828]' : 'border-[#003828]/10 text-[#003828] hover:border-[#003828]/30'}`}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                    <div>
                      <input 
                        type="number" 
                        placeholder="Custom Amount ($)" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="w-full px-4 py-3 rounded-xl border border-[#003828]/10 bg-transparent text-stone-900 focus:outline-none focus:border-[#003828] transition-colors"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={!amount} 
                      className="mt-auto w-full bg-[#003828] text-white py-4 rounded-full font-bold border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Donate {amount ? `$${amount}` : ''}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Modals() {
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenDonation = () => setIsDonationOpen(true);
    // Redirect any residual events to their respective dedicated pages, ensuring NO modal pop-ups
    const handleOpenPartner = () => {
      try {
        sessionStorage.setItem('espa_scroll_/', window.scrollY.toString());
      } catch (e) {}
      navigate('/partner', { state: { scrollY: window.scrollY } });
    };
    const handleOpenVolunteer = () => {
      try {
        sessionStorage.setItem('espa_scroll_/', window.scrollY.toString());
      } catch (e) {}
      navigate('/volunteer', { state: { scrollY: window.scrollY } });
    };
    const handleOpenAmbassador = () => {
      try {
        sessionStorage.setItem('espa_scroll_/', window.scrollY.toString());
      } catch (e) {}
      navigate('/ambassador', { state: { scrollY: window.scrollY } });
    };

    window.addEventListener('open-donation', handleOpenDonation);
    window.addEventListener('open-partner', handleOpenPartner);
    window.addEventListener('open-volunteer', handleOpenVolunteer);
    window.addEventListener('open-ambassador', handleOpenAmbassador);

    return () => {
      window.removeEventListener('open-donation', handleOpenDonation);
      window.removeEventListener('open-partner', handleOpenPartner);
      window.removeEventListener('open-volunteer', handleOpenVolunteer);
      window.removeEventListener('open-ambassador', handleOpenAmbassador);
    };
  }, [navigate]);

  return (
    <>
      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
    </>
  );
}
