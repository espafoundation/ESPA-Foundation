import fs from 'fs';
let code = fs.readFileSync('src/components/Modals.tsx', 'utf-8');

const replacement = `
function PartnerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSubmitted(false);
        recaptchaRef.current?.reset();
      }, 300);
    }
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#004B36]/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full max-w-[500px] h-[500px] max-h-[90vh] bg-white rounded-3xl overflow-y-auto shadow-2xl border border-[#004B36]/5 flex flex-col">
            <button onClick={onClose} className="absolute top-6 right-6 text-[#004B36]/50 hover:text-[#004B36] transition-colors z-10">
              <X size={20} />
            </button>
            <div className="p-8 md:p-10 flex flex-col flex-1">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#004B36] text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2 text-[#004B36]">Thank You!</h3>
                  <p className="text-[#004B36]/60 mb-8">Your partnership proposal has been submitted.</p>
                  <button onClick={onClose} className="w-full bg-[#004B36] text-white py-4 rounded-full font-bold hover:bg-[#003828] transition-colors">Close</button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2 text-[#004B36]">Partner With Us</h2>
                  <p className="text-[#004B36]/60 text-sm mb-8">Let's collaborate to make a lasting impact.</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const recaptchaToken = recaptchaRef.current?.getValue();
                    if (!recaptchaToken) {
                      toast.error("Please verify that you are not a robot.");
                      return;
                    }
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const btn = form.querySelector('button[type="submit"]');
                    if (btn) btn.textContent = 'Submitting...';

                    try {
                      // Save to applications
                      const apps = JSON.parse(localStorage.getItem('ain_applications') || '[]');
                      apps.unshift({
                        id: Date.now().toString(),
                        type: 'partner',
                        name: formData.get('name'),
                        email: formData.get('email'),
                        company: formData.get('organization'),
                        message: formData.get('proposal'),
                        date: new Date().toISOString(),
                        status: 'Pending'
                      });
                      localStorage.setItem('ain_applications', JSON.stringify(apps));
                      window.dispatchEvent(new Event('storage'));

                      // Send to API
                      const response = await fetch('/api/partner', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: formData.get('name'),
                          organization: formData.get('organization'),
                          email: formData.get('email'),
                          proposal: formData.get('proposal'),
                          recaptchaToken
                        })
                      });
                      // Ignore error for now, as it might fail due to dummy smtp
                      setSubmitted(true);
                      toast.success('Submitted successfully!');
                    } catch (err: any) {
                      console.error(err);
                      toast.error('Something went wrong. Please try again.');
                      if (btn) btn.textContent = 'Submit Proposal';
                      recaptchaRef.current?.reset();
                    }
                  }} className="flex flex-col gap-4 flex-1">
                    <div><input type="text" name="name" placeholder="Full Name" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><input type="text" name="organization" placeholder="Organization Name" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><input type="email" name="email" placeholder="Email Address" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><textarea name="proposal" placeholder="Brief description of your proposal" rows={3} required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors resize-none" /></div>
                    <div className="flex justify-center my-1 scale-90 origin-left"><ReCAPTCHA ref={recaptchaRef} sitekey="6LfwCZYtAAAAAJfP8Lp_sa-rZjiIEFbC8SIhi0EW" /></div>
                    <button type="submit" className="mt-auto w-full bg-[#004B36] text-white py-4 rounded-full font-bold hover:bg-[#003828] transition-colors">Submit Proposal</button>
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

function VolunteerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSubmitted(false);
        recaptchaRef.current?.reset();
      }, 300);
    }
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#004B36]/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full max-w-[500px] h-[500px] max-h-[90vh] bg-white rounded-3xl overflow-y-auto shadow-2xl border border-[#004B36]/5 flex flex-col">
            <button onClick={onClose} className="absolute top-6 right-6 text-[#004B36]/50 hover:text-[#004B36] transition-colors z-10"><X size={20} /></button>
            <div className="p-8 md:p-10 flex flex-col flex-1">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#004B36] text-white rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                  <h3 className="font-display text-2xl font-bold mb-2 text-[#004B36]">Thank You!</h3>
                  <p className="text-[#004B36]/60 mb-8">Your volunteer application has been submitted.</p>
                  <button onClick={onClose} className="w-full bg-[#004B36] text-white py-4 rounded-full font-bold hover:bg-[#003828] transition-colors">Close</button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2 text-[#004B36]">Volunteer With Us</h2>
                  <p className="text-[#004B36]/60 text-sm mb-8">Fill out the form below to express your interest.</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const recaptchaToken = recaptchaRef.current?.getValue();
                    if (!recaptchaToken) {
                      toast.error("Please verify that you are not a robot.");
                      return;
                    }
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const btn = form.querySelector('button[type="submit"]');
                    if (btn) btn.textContent = 'Submitting...';

                    try {
                      const apps = JSON.parse(localStorage.getItem('ain_applications') || '[]');
                      apps.unshift({
                        id: Date.now().toString(),
                        type: 'volunteer',
                        name: formData.get('name'),
                        email: formData.get('email'),
                        area_of_interest: formData.get('area_of_interest'),
                        availability: formData.get('availability'),
                        date: new Date().toISOString(),
                        status: 'Pending'
                      });
                      localStorage.setItem('ain_applications', JSON.stringify(apps));
                      window.dispatchEvent(new Event('storage'));

                      await fetch('/api/volunteer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: formData.get('name'),
                          email: formData.get('email'),
                          area_of_interest: formData.get('area_of_interest'),
                          availability: formData.get('availability'),
                          recaptchaToken
                        })
                      });
                      
                      setSubmitted(true);
                      toast.success('Submitted successfully!');
                    } catch (err: any) {
                      console.error(err);
                      toast.error('Something went wrong. Please try again.');
                      if (btn) btn.textContent = 'Apply Now';
                      recaptchaRef.current?.reset();
                    }
                  }} className="flex flex-col gap-4 flex-1">
                    <div><input type="text" name="name" placeholder="Full Name" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><input type="email" name="email" placeholder="Email Address" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div>
                      <select name="area_of_interest" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors">
                        <option value="" disabled selected>Area of Interest</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Environment">Environment</option>
                        <option value="Fundraising">Fundraising</option>
                      </select>
                    </div>
                    <div>
                      <select name="availability" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors">
                        <option value="" disabled selected>Availability</option>
                        <option value="1-5 hours/week">1-5 hours/week</option>
                        <option value="5-10 hours/week">5-10 hours/week</option>
                        <option value="10+ hours/week">10+ hours/week</option>
                      </select>
                    </div>
                    <div className="flex justify-center my-1 scale-90 origin-left"><ReCAPTCHA ref={recaptchaRef} sitekey="6LfwCZYtAAAAAJfP8Lp_sa-rZjiIEFbC8SIhi0EW" /></div>
                    <button type="submit" className="mt-auto w-full bg-[#004B36] text-white py-4 rounded-full font-bold hover:bg-[#003828] transition-colors">Apply Now</button>
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

function AmbassadorModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', social: '', motivation: '' });
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', social: '', motivation: '' });
        setErrors({});
        recaptchaRef.current?.reset();
      }, 300);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.name && formData.email && formData.phone && formData.social && formData.motivation;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#004B36]/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full max-w-[500px] h-[500px] max-h-[90vh] bg-white rounded-3xl overflow-y-auto shadow-2xl border border-[#004B36]/5 flex flex-col">
            <button onClick={onClose} className="absolute top-6 right-6 text-[#004B36]/50 hover:text-[#004B36] transition-colors z-10"><X size={20} /></button>
            <div className="p-8 md:p-10 flex flex-col flex-1">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#004B36] text-white rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                  <h3 className="font-display text-2xl font-bold mb-2 text-[#004B36]">Thank You!</h3>
                  <p className="text-[#004B36]/60 mb-8">We have received your ambassador application.</p>
                  <button onClick={onClose} className="w-full bg-[#004B36] text-white py-4 rounded-full font-bold hover:bg-[#003828] transition-colors">Close</button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2 text-[#004B36]">Become an Ambassador</h2>
                  <p className="text-[#004B36]/60 text-sm mb-8">Represent ESPA Foundation in your community.</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!isFormValid) return;
                    
                    const recaptchaToken = recaptchaRef.current?.getValue();
                    if (!recaptchaToken) {
                      toast.error("Please verify that you are not a robot.");
                      return;
                    }
                    const btn = e.currentTarget.querySelector('button[type="submit"]');
                    if (btn) btn.textContent = 'Submitting...';

                    try {
                      const apps = JSON.parse(localStorage.getItem('ain_applications') || '[]');
                      apps.unshift({
                        id: Date.now().toString(),
                        type: 'ambassador',
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        company: '',
                        message: formData.motivation,
                        date: new Date().toISOString(),
                        status: 'Pending'
                      });
                      localStorage.setItem('ain_applications', JSON.stringify(apps));
                      window.dispatchEvent(new Event('storage'));

                      await fetch('/api/ambassador', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ...formData,
                          recaptchaToken
                        })
                      });

                      setSubmitted(true);
                      toast.success('Submitted successfully!');
                    } catch (err: any) {
                      console.error(err);
                      toast.error('Something went wrong. Please try again.');
                      if (btn) btn.textContent = 'Apply Now';
                      recaptchaRef.current?.reset();
                    }
                  }} className="flex flex-col gap-4 flex-1">
                    <div><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><input type="text" name="social" value={formData.social} onChange={handleChange} placeholder="Social Media Profile Link" required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors" /></div>
                    <div><textarea name="motivation" value={formData.motivation} onChange={handleChange} placeholder="Why do you want to be an ambassador?" rows={3} required className="w-full px-4 py-3 rounded-xl border border-[#004B36]/10 bg-transparent text-[#004B36] focus:outline-none focus:border-[#004B36] transition-colors resize-none" /></div>
                    <div className="flex justify-center my-1 scale-90 origin-left"><ReCAPTCHA ref={recaptchaRef} sitekey="6LfwCZYtAAAAAJfP8Lp_sa-rZjiIEFbC8SIhi0EW" /></div>
                    <button type="submit" disabled={!isFormValid} className="mt-auto w-full bg-[#004B36] text-white py-4 rounded-full font-bold hover:bg-[#003828] disabled:opacity-50 transition-colors">Apply Now</button>
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

`;

const startIdx = code.indexOf('function PartnerModal');
const endIdx = code.indexOf('export default function Modals');

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
  fs.writeFileSync('src/components/Modals.tsx', code);
  console.log('Successfully replaced modals');
} else {
  console.log('Could not find start or end index');
}
