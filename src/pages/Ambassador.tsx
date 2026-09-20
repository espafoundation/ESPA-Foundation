import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { Country, City } from 'country-state-city';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import SearchableDropdown, { DropdownOption } from '../components/SearchableDropdown';
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha';

const STORAGE_KEY = 'espa_ambassador_form_draft';

export default function Ambassador() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const fromSection = (location.state as any)?.fromSection || sessionStorage.getItem('espa_last_section') || 'get-involved';
    const savedY = (location.state as any)?.scrollY ?? (sessionStorage.getItem('espa_scroll_/') ? parseInt(sessionStorage.getItem('espa_scroll_/')!, 10) : undefined);

    sessionStorage.setItem('espa_restore_target', JSON.stringify({
      path: '/',
      section: fromSection,
      scrollY: savedY
    }));

    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/#${fromSection}`);
    }
  };

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    gender: '',
    dob: '',
    country: '',
    city: '',
    institution: '',
    department_or_major: '',
    current_status: '',
    social: '',
    motivation: '',
    experience: ''
  });

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Country & City Dropdown States
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [customCity, setCustomCity] = useState('');

  // All countries sorted alphabetically
  const allCountries = useMemo(() => {
    return Country.getAllCountries()
      .map(c => ({
        name: c.name,
        isoCode: c.isoCode,
        flag: c.flag
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const countryOptions: DropdownOption[] = useMemo(() => {
    return allCountries.map(c => ({
      value: c.isoCode,
      label: c.name
    }));
  }, [allCountries]);

  const availableCities = useMemo(() => {
    if (!selectedCountryCode) return [];
    const rawCities = City.getCitiesOfCountry(selectedCountryCode) || [];
    const uniqueNames = Array.from(new Set(rawCities.map(c => c.name.trim()))).filter(Boolean);
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [selectedCountryCode]);

  const cityOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = availableCities.map(cityName => ({
      value: cityName,
      label: cityName
    }));
    if (list.length > 0) {
      list.push({
        value: 'Other / Not Listed',
        label: 'Other / Not Listed'
      });
    }
    return list;
  }, [availableCities]);

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Real-time validation errors object
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    // First Name
    if (!formData.first_name.trim()) {
      errs.first_name = 'First Name is required';
    } else if (formData.first_name.length > 50) {
      errs.first_name = 'First Name cannot exceed 50 characters';
    }

    // Last Name
    if (!formData.last_name.trim()) {
      errs.last_name = 'Last Name is required';
    } else if (formData.last_name.length > 50) {
      errs.last_name = 'Last Name cannot exceed 50 characters';
    }

    // Email
    if (!formData.email.trim()) {
      errs.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    } else if (formData.email.length > 100) {
      errs.email = 'Email Address cannot exceed 100 characters';
    }

    // Phone
    if (!formData.phone.trim()) {
      errs.phone = 'Phone Number is required';
    } else if (formData.phone.length > 25) {
      errs.phone = 'Phone Number cannot exceed 25 characters';
    }

    // Password: min 8 chars, 1 uppercase, 1 lowercase, 1 symbol
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(formData.password)) {
      errs.password = 'Password must include at least 1 uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      errs.password = 'Password must include at least 1 lowercase letter';
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      errs.password = 'Password must include at least 1 symbol (!@#$%^&*)';
    }

    // Confirm Password
    if (!formData.confirm_password) {
      errs.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      errs.confirm_password = 'Passwords do not match';
    }

    // Gender
    if (!formData.gender) {
      errs.gender = 'Gender is required';
    }

    // Date of Birth
    if (!formData.dob) {
      errs.dob = 'Date of Birth is required';
    }

    // Country
    if (!formData.country.trim()) {
      errs.country = 'Country is required';
    }

    // City
    if (!formData.city.trim() && !customCity.trim()) {
      errs.city = 'City is required';
    } else if (formData.city === 'Other / Not Listed' && !customCity.trim()) {
      errs.city = 'Please specify your city name';
    }

    // Institution
    if (!formData.institution.trim()) {
      errs.institution = 'University, College, or Organization is required';
    }

    // Department or Major
    if (!formData.department_or_major.trim()) {
      errs.department_or_major = 'Department, Major, or Field is required';
    }

    // Social / LinkedIn
    if (!formData.social.trim()) {
      errs.social = 'LinkedIn or Social profile link is required';
    }

    // Motivation
    if (!formData.motivation.trim()) {
      errs.motivation = 'Please share your motivation for becoming an Ambassador';
    } else if (formData.motivation.trim().length < 15) {
      errs.motivation = 'Motivation must be at least 15 characters';
    }

    return errs;
  }, [formData, customCity]);

  const shouldShowError = (field: string) => {
    return Boolean((hasSubmittedAttempt || touched[field]) && validationErrors[field]);
  };

  // Restore draft from local storage on mount with 48h expiration
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (!savedDraft) return;

      const parsed = JSON.parse(savedDraft);
      if (parsed?.savedAt) {
        const ageInMs = Date.now() - new Date(parsed.savedAt).getTime();
        const maxAgeInMs = 48 * 60 * 60 * 1000; // 48 hours

        if (ageInMs > maxAgeInMs) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
      }

      if (parsed?.formData) {
        let first_name = parsed.formData.first_name || '';
        let last_name = parsed.formData.last_name || '';
        if (!first_name && parsed.formData.name) {
          const parts = parsed.formData.name.trim().split(' ');
          first_name = parts[0] || '';
          last_name = parts.slice(1).join(' ') || '';
        }

        setFormData(prev => ({
          ...prev,
          ...parsed.formData,
          first_name,
          last_name
        }));

        if (parsed.formData.countryCode) {
          setSelectedCountryCode(parsed.formData.countryCode);
        }
        if (parsed.customCity) {
          setCustomCity(parsed.customCity);
        }
      }
    } catch (e) {
      console.error('Error loading ambassador form draft:', e);
    }
  }, []);

  // Debounced auto-save draft to local storage
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setTimeout(() => {
      try {
        const hasContent = Object.values(formData).some(val => typeof val === 'string' && val.trim() !== '') || Boolean(customCity.trim());
        if (!hasContent) return;

        const draft = {
          formData: {
            ...formData,
            countryCode: selectedCountryCode
          },
          customCity,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (err) {
        console.error('Error saving ambassador form draft:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, selectedCountryCode, customCity, isSubmitted]);

  // Clear auto-saved draft
  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      gender: '',
      dob: '',
      country: '',
      city: '',
      institution: '',
      department_or_major: '',
      current_status: '',
      social: '',
      motivation: '',
      experience: ''
    });
    setSelectedCountryCode('');
    setCustomCity('');
    setTouched({});
    setHasSubmittedAttempt(false);
    recaptchaRef.current?.reset();
    toast.success('Form draft cleared.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    markTouched(name);
  };

  const handleCountrySelect = (isoCode: string) => {
    setSelectedCountryCode(isoCode);
    const countryObj = allCountries.find(c => c.isoCode === isoCode);
    setFormData(prev => ({
      ...prev,
      country: countryObj ? countryObj.name : isoCode,
      city: ''
    }));
    setCustomCity('');
    markTouched('country');
  };

  const handleCitySelect = (cityName: string) => {
    setFormData(prev => ({
      ...prev,
      city: cityName
    }));
    if (cityName !== 'Other / Not Listed') {
      setCustomCity('');
    }
    markTouched('city');
  };

  const candidateFullName = `${formData.first_name} ${formData.last_name}`.trim();
  const finalCity = formData.city === 'Other / Not Listed' ? customCity.trim() : (formData.city || customCity).trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmittedAttempt(true);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please complete all required fields correctly.');
      return;
    }

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      toast.error('Please verify that you are not a robot.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Clear saved draft on successful submission
      localStorage.removeItem(STORAGE_KEY);

      // 1. Save to local storage for administrative portal sync
      const apps = JSON.parse(localStorage.getItem('ain_applications') || '[]');
      apps.unshift({
        id: Date.now().toString(),
        type: 'ambassador',
        name: candidateFullName,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dob: formData.dob,
        country: formData.country,
        city: finalCity,
        company: formData.institution,
        institution: formData.institution,
        department: formData.department_or_major,
        current_status: formData.current_status,
        social: formData.social,
        message: formData.motivation,
        experience: formData.experience,
        date: new Date().toISOString(),
        status: 'Pending'
      });
      localStorage.setItem('ain_applications', JSON.stringify(apps));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('ain_applications_updated'));

      // 2. Dispatch to backend API
      const response = await fetch('/api/ambassador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateFullName,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          institution: formData.institution,
          city: `${finalCity}, ${formData.country}`,
          social: formData.social,
          motivation: formData.motivation,
          experience: formData.experience,
          recaptchaToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Backend ambassador endpoint warning:', errorData.error);
      }

      setIsSubmitted(true);
      toast.success('Your ambassador application has been submitted successfully!');
    } catch (err: any) {
      console.error('Ambassador submission error:', err);
      toast.error('Something went wrong. Please try again.');
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Become an Ambassador | ESPA Foundation</title>
        <meta name="description" content="Represent ESPA Foundation as a Youth or Community Ambassador. Lead initiatives, build networks, and champion educational equity." />
        <meta property="og:title" content="Become an Ambassador | ESPA Foundation" />
        <meta property="og:description" content="Represent ESPA Foundation as a Youth or Community Ambassador. Lead initiatives, build networks, and champion educational equity." />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <button 
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#003828] hover:text-[#003828]/70 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#003828] mb-4">
            Become an Ambassador
          </h1>
          <p className="font-sans text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto text-center">
            <span className="block">Represent ESPA Foundation as a Youth or Community Ambassador.</span>
            <span className="block">Lead initiatives, build networks, and champion educational equity.</span>
          </p>
        </div>

        {/* Form or Confirmation Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-10 md:p-12">
          {isSubmitted ? (
            <div className="text-center py-12 px-4 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-[#003828]/10 text-[#003828] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={44} className="text-[#003828]" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                Thank you for your application!
              </h2>
              <p className="text-stone-600 mb-2 leading-relaxed">
                Thank you, <span className="font-semibold text-stone-900">{candidateFullName || 'Applicant'}</span>, for stepping forward to lead with <span className="font-semibold text-[#003828]">ESPA Foundation</span>.
              </p>
              <p className="text-sm text-stone-500 mb-8 leading-relaxed">
                Our outreach leadership committee will review your profile and reach out via <span className="font-medium text-stone-800">{formData.email}</span> to schedule an introductory interview and onboarding briefing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-[#003828] text-white border border-[#003828] px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all text-center inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Return to Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      first_name: '',
                      last_name: '',
                      email: '',
                      phone: '',
                      password: '',
                      confirm_password: '',
                      gender: '',
                      dob: '',
                      country: '',
                      city: '',
                      institution: '',
                      department_or_major: '',
                      current_status: '',
                      social: '',
                      motivation: '',
                      experience: ''
                    });
                    setSelectedCountryCode('');
                    setCustomCity('');
                    setTouched({});
                    setHasSubmittedAttempt(false);
                  }}
                  className="border border-stone-300 text-stone-700 px-6 py-3.5 rounded-full font-bold text-sm hover:bg-stone-50 transition-colors"
                >
                  Submit Another Application
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {/* Section 1: Personal Information */}
              <div className="space-y-4">
                <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                  Personal Information<span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      First Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      maxLength={50}
                      onChange={handleChange}
                      onBlur={() => markTouched('first_name')}
                      placeholder="Enter Your First Name"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('first_name')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('first_name') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.first_name}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Last Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      maxLength={50}
                      onChange={handleChange}
                      onBlur={() => markTouched('last_name')}
                      placeholder="Enter Your Last Name"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('last_name')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('last_name') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.last_name}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Email Address<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      maxLength={100}
                      onChange={handleChange}
                      onBlur={() => markTouched('email')}
                      placeholder="Enter Your Email Address"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('email')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('email') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Phone Number<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      maxLength={25}
                      onChange={handleChange}
                      onBlur={() => markTouched('phone')}
                      placeholder="Enter Your Phone Number"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('phone')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('phone') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => markTouched('password')}
                        placeholder="Enter Your Password"
                        required
                        className={`w-full pl-4 pr-11 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                          shouldShowError('password')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#003828] transition-colors p-0.5 cursor-pointer flex items-center justify-center focus:outline-none"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {shouldShowError('password') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Confirm Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        onBlur={() => markTouched('confirm_password')}
                        placeholder="Confirm Your Password"
                        required
                        className={`w-full pl-4 pr-11 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                          shouldShowError('confirm_password')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#003828] transition-colors p-0.5 cursor-pointer flex items-center justify-center focus:outline-none"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {shouldShowError('confirm_password') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.confirm_password}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Gender<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        onBlur={() => markTouched('gender')}
                        required
                        className={`w-full pl-4 pr-11 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs focus:outline-none appearance-none cursor-pointer ${
                          shouldShowError('gender')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      >
                        <option value="" disabled>Select Your Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <ChevronDown 
                        size={18} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
                      />
                    </div>
                    {shouldShowError('gender') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.gender}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Date of Birth<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      onBlur={() => markTouched('dob')}
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('dob')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('dob') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.dob}
                      </p>
                    )}
                  </div>

                  {/* Country Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Country<span className="text-red-500">*</span>
                    </label>
                    <SearchableDropdown
                      options={countryOptions}
                      value={selectedCountryCode}
                      onChange={handleCountrySelect}
                      placeholder="Select Your Country"
                      searchPlaceholder="Search country..."
                      error={shouldShowError('country') ? validationErrors.country : undefined}
                      onBlur={() => markTouched('country')}
                    />
                    {shouldShowError('country') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.country}
                      </p>
                    )}
                  </div>

                  {/* City Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      City<span className="text-red-500">*</span>
                    </label>
                    {availableCities.length > 0 ? (
                      <SearchableDropdown
                        options={cityOptions}
                        value={formData.city}
                        onChange={handleCitySelect}
                        placeholder={selectedCountryCode ? 'Select Your City' : 'Select Country First'}
                        searchPlaceholder="Search city..."
                        disabled={!selectedCountryCode}
                        disabledMessage="Select Country First"
                        error={shouldShowError('city') ? validationErrors.city : undefined}
                        onBlur={() => markTouched('city')}
                        allowCustomOption={true}
                        customOptionLabel="Other / Not Listed"
                      />
                    ) : (
                      <input
                        type="text"
                        name="city"
                        value={customCity}
                        maxLength={100}
                        onChange={(e) => {
                          setCustomCity(e.target.value);
                          markTouched('city');
                        }}
                        onBlur={() => markTouched('city')}
                        placeholder={selectedCountryCode ? 'Enter Your City' : 'Select Country First'}
                        disabled={!selectedCountryCode}
                        required
                        className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none disabled:bg-stone-50 disabled:text-stone-400 ${
                          shouldShowError('city')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      />
                    )}
                    {shouldShowError('city') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.city}
                      </p>
                    )}
                  </div>

                  {/* Custom City Input */}
                  {availableCities.length > 0 && formData.city === 'Other / Not Listed' && (
                    <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-1">
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                        Enter Your City Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customCity}
                        maxLength={100}
                        onChange={(e) => {
                          setCustomCity(e.target.value);
                          markTouched('city');
                        }}
                        onBlur={() => markTouched('city')}
                        placeholder="Enter Your City Name"
                        required
                        className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                          shouldShowError('city')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      />
                      {shouldShowError('city') && (
                        <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                          {validationErrors.city}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Academic & Institutional Details */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                  Academic & Institutional Details<span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Institution */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      University, College, or Organization<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      maxLength={100}
                      onChange={handleChange}
                      onBlur={() => markTouched('institution')}
                      placeholder="Enter Your Institution"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('institution')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('institution') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.institution}
                      </p>
                    )}
                  </div>

                  {/* Department / Major */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Department, Major, or Field of Study<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="department_or_major"
                      value={formData.department_or_major}
                      maxLength={100}
                      onChange={handleChange}
                      onBlur={() => markTouched('department_or_major')}
                      placeholder="Enter Your Department or Major"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('department_or_major')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('department_or_major') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.department_or_major}
                      </p>
                    )}
                  </div>

                  {/* Current Status */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Current Academic or Career Status
                    </label>
                    <div className="relative">
                      <select
                        name="current_status"
                        value={formData.current_status}
                        onChange={handleChange}
                        className="w-full pl-4 pr-11 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] appearance-none cursor-pointer"
                      >
                        <option value="">Select Your Current Status</option>
                        <option value="Undergraduate Student">Undergraduate Student</option>
                        <option value="Graduate / Post-Graduate Student">Graduate / Post-Graduate Student</option>
                        <option value="Recent Graduate">Recent Graduate</option>
                        <option value="Faculty / Academician">Faculty / Academician</option>
                        <option value="Working Professional">Working Professional</option>
                        <option value="Community Activist / Other">Community Activist / Other</option>
                      </select>
                      <ChevronDown 
                        size={18} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
                      />
                    </div>
                  </div>

                  {/* LinkedIn / Social URL */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      LinkedIn or Social Profile Link<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="social"
                      value={formData.social}
                      onChange={handleChange}
                      onBlur={() => markTouched('social')}
                      placeholder="Enter Your LinkedIn Handle"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('social')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('social') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.social}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Mission & Leadership Experience */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                  Mission & Leadership Experience<span className="text-red-500">*</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Why do you want to represent ESPA Foundation as an Ambassador?<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleChange}
                    onBlur={() => markTouched('motivation')}
                    rows={4}
                    required
                    placeholder="Enter Your Motivation and Goals"
                    className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none resize-none ${
                      shouldShowError('motivation')
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                    }`}
                  />
                  {shouldShowError('motivation') && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                      {validationErrors.motivation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Previous Leadership or Community Engagement Experience
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter Your Leadership and Community Experience (Optional)"
                    className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* reCAPTCHA Verification */}
              <div className="pt-2 flex flex-col items-center sm:items-start">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                />
              </div>

              {/* Submit & Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link
                    to="/"
                    className="border border-[#003828] text-[#003828] bg-white px-6 py-3.5 rounded-full font-bold text-sm tracking-wide hover:bg-[#003828] hover:text-white hover:border-[#003828] transition-all inline-flex items-center justify-center shadow-2xs"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="border border-stone-300 text-stone-600 bg-white px-6 py-3.5 rounded-full font-bold text-sm tracking-wide hover:text-red-600 hover:border-red-300 hover:bg-red-50/50 transition-colors cursor-pointer shadow-2xs"
                  >
                    Clear Draft
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#003828] text-white border border-[#003828] px-8 py-3.5 rounded-full font-bold text-sm tracking-wide hover:bg-white hover:text-[#003828] hover:border-[#003828] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
