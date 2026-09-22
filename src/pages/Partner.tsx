import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { Country, City } from 'country-state-city';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  ChevronDown
} from 'lucide-react';
import SearchableDropdown, { DropdownOption } from '../components/SearchableDropdown';
import PhoneCountryInput from '../components/PhoneCountryInput';
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha';

const STORAGE_KEY = 'espa_partner_form_draft';

export default function Partner() {
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
    full_name: '',
    email: '',
    phone: '',
    phone_country_code: '+92',
    designation: '',
    country: '',
    city: '',
    organization: '',
    website: '',
    org_country: '',
    org_city: '',
    partnership_type: '',
    proposal: '',
    timeline_or_goals: ''
  });

  // Personal Location States
  const [selectedPersonalCountryCode, setSelectedPersonalCountryCode] = useState('');
  const [customPersonalCity, setCustomPersonalCity] = useState('');

  // Organization Location States (Completely unlinked from Personal Location)
  const [selectedOrgCountryCode, setSelectedOrgCountryCode] = useState('');
  const [customOrgCity, setCustomOrgCity] = useState('');

  // All countries sorted alphabetically (excluding Israel, Palestine mapped)
  const allCountries = useMemo(() => {
    return Country.getAllCountries()
      .filter(c => c.name.toLowerCase() !== 'israel' && c.isoCode !== 'IL' && !c.name.toLowerCase().includes('israel'))
      .map(c => ({
        name: (c.name.includes('Palestinian Territory') || c.name.includes('Palestine')) ? 'Palestine' : c.name,
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

  // Personal Cities
  const availablePersonalCities = useMemo(() => {
    if (!selectedPersonalCountryCode) return [];
    const rawCities = City.getCitiesOfCountry(selectedPersonalCountryCode) || [];
    const uniqueNames = Array.from(new Set(rawCities.map(c => (c?.name || '').trim()))).filter(Boolean);
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [selectedPersonalCountryCode]);

  const personalCityOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = availablePersonalCities.map(cityName => ({
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
  }, [availablePersonalCities]);

  // Organization Cities (Unlinked)
  const availableOrgCities = useMemo(() => {
    if (!selectedOrgCountryCode) return [];
    const rawCities = City.getCitiesOfCountry(selectedOrgCountryCode) || [];
    const uniqueNames = Array.from(new Set(rawCities.map(c => (c?.name || '').trim()))).filter(Boolean);
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [selectedOrgCountryCode]);

  const orgCityOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = availableOrgCities.map(cityName => ({
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
  }, [availableOrgCities]);

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Real-time validation errors object
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Full Name
    if (!formData.full_name?.trim()) {
      errs.full_name = 'Representative Full Name is required';
    } else if (formData.full_name.trim().length < 2) {
      errs.full_name = 'Please enter representative full name';
    } else if (formData.full_name.length > 70) {
      errs.full_name = 'Full Name cannot exceed 70 characters';
    }

    // Designation
    if (!formData.designation?.trim()) {
      errs.designation = 'Designation or Job Role is required';
    }

    // Phone
    if (!formData.phone?.trim()) {
      errs.phone = 'Phone Number is required';
    } else if (formData.phone.length > 25) {
      errs.phone = 'Phone Number cannot exceed 25 characters';
    }

    // Email
    if (!formData.email?.trim()) {
      errs.email = 'Official Work Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid work email address';
    } else if (formData.email.length > 100) {
      errs.email = 'Email Address cannot exceed 100 characters';
    }

    // Personal Country
    if (!formData.country?.trim()) {
      errs.country = 'Country is required';
    }

    // Personal City
    const effectivePersonalCity = formData.city === 'Other / Not Listed'
      ? customPersonalCity.trim()
      : (formData.city || customPersonalCity).trim();
    if (!effectivePersonalCity) {
      errs.city = 'City is required';
    }

    // Organization Name
    if (!formData.organization?.trim()) {
      errs.organization = 'Organization or Company Name is required';
    } else if (formData.organization.length > 120) {
      errs.organization = 'Organization Name cannot exceed 120 characters';
    }

    // Organization Country
    if (!formData.org_country?.trim()) {
      errs.org_country = 'Headquarters Country is required';
    }

    // Organization City
    const effectiveOrgCity = formData.org_city === 'Other / Not Listed'
      ? customOrgCity.trim()
      : (formData.org_city || customOrgCity).trim();
    if (!effectiveOrgCity) {
      errs.org_city = 'Headquarters City is required';
    }

    // Partnership Type
    if (!formData.partnership_type) {
      errs.partnership_type = 'Please select a partnership category';
    }

    // Proposal
    if (!formData.proposal?.trim()) {
      errs.proposal = 'Partnership proposal description is required';
    } else if (formData.proposal.trim().length < 20) {
      errs.proposal = 'Proposal must be at least 20 characters';
    }

    return errs;
  }, [formData, customPersonalCity, customOrgCity]);

  const shouldShowError = (field: string) => {
    return Boolean(hasSubmittedAttempt && validationErrors[field]);
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
        let full_name = parsed.formData.full_name || '';
        if (!full_name) {
          const first = parsed.formData.first_name || '';
          const last = parsed.formData.last_name || '';
          full_name = `${first} ${last}`.trim() || parsed.formData.name || '';
        }

        setFormData(prev => ({
          ...prev,
          ...parsed.formData,
          full_name,
          phone_country_code: parsed.formData.phone_country_code || '+92'
        }));

        if (parsed.selectedPersonalCountryCode || parsed.formData.countryCode) {
          setSelectedPersonalCountryCode(parsed.selectedPersonalCountryCode || parsed.formData.countryCode);
        }
        if (parsed.customPersonalCity || parsed.customCity) {
          setCustomPersonalCity(parsed.customPersonalCity || parsed.customCity);
        }
        if (parsed.selectedOrgCountryCode || parsed.formData.orgCountryCode) {
          setSelectedOrgCountryCode(parsed.selectedOrgCountryCode || parsed.formData.orgCountryCode);
        }
        if (parsed.customOrgCity) {
          setCustomOrgCity(parsed.customOrgCity);
        }
      }
    } catch (e) {
      console.error('Error loading partner form draft:', e);
    }
  }, []);

  // Debounced auto-save draft to local storage
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setTimeout(() => {
      try {
        const hasContent = Object.values(formData).some(val => typeof val === 'string' && val.trim() !== '') || 
          Boolean((customPersonalCity || '').trim()) || 
          Boolean((customOrgCity || '').trim());
        if (!hasContent) return;

        const draft = {
          formData: {
            ...formData,
            countryCode: selectedPersonalCountryCode,
            orgCountryCode: selectedOrgCountryCode
          },
          selectedPersonalCountryCode,
          customPersonalCity,
          selectedOrgCountryCode,
          customOrgCity,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (err) {
        console.error('Error saving partner form draft:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, selectedPersonalCountryCode, customPersonalCity, selectedOrgCountryCode, customOrgCity, isSubmitted]);

  // Clear auto-saved draft
  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      phone_country_code: '+92',
      designation: '',
      country: '',
      city: '',
      organization: '',
      website: '',
      org_country: '',
      org_city: '',
      partnership_type: '',
      proposal: '',
      timeline_or_goals: ''
    });
    setSelectedPersonalCountryCode('');
    setCustomPersonalCity('');
    setSelectedOrgCountryCode('');
    setCustomOrgCity('');
    setTouched({});
    setHasSubmittedAttempt(false);
    recaptchaRef.current?.reset();
    toast.success('Form draft cleared.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    markTouched(name);
  };

  const handlePersonalCountrySelect = (isoCode: string) => {
    setSelectedPersonalCountryCode(isoCode);
    const countryObj = allCountries.find(c => c.isoCode === isoCode);
    setFormData(prev => ({
      ...prev,
      country: countryObj ? countryObj.name : isoCode,
      city: ''
    }));
    setCustomPersonalCity('');
    markTouched('country');
  };

  const handlePersonalCitySelect = (cityName: string) => {
    setFormData(prev => ({
      ...prev,
      city: cityName
    }));
    if (cityName !== 'Other / Not Listed') {
      setCustomPersonalCity('');
    }
    markTouched('city');
  };

  const handleOrgCountrySelect = (isoCode: string) => {
    setSelectedOrgCountryCode(isoCode);
    const countryObj = allCountries.find(c => c.isoCode === isoCode);
    setFormData(prev => ({
      ...prev,
      org_country: countryObj ? countryObj.name : isoCode,
      org_city: ''
    }));
    setCustomOrgCity('');
    markTouched('org_country');
  };

  const handleOrgCitySelect = (cityName: string) => {
    setFormData(prev => ({
      ...prev,
      org_city: cityName
    }));
    if (cityName !== 'Other / Not Listed') {
      setCustomOrgCity('');
    }
    markTouched('org_city');
  };

  const representativeFullName = (formData.full_name || '').trim();
  const firstName = representativeFullName.split(/\s+/)[0] || '';
  const lastName = representativeFullName.split(/\s+/).slice(1).join(' ') || '';
  const fullPhone = `${formData.phone_country_code || '+92'} ${formData.phone || ''}`.trim();
  const finalPersonalCity = formData.city === 'Other / Not Listed' 
    ? (customPersonalCity || '').trim() 
    : (formData.city || customPersonalCity || '').trim();
  const finalOrgCity = formData.org_city === 'Other / Not Listed' 
    ? (customOrgCity || '').trim() 
    : (formData.org_city || customOrgCity || '').trim();

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

      // 1. Dispatch to backend API with consistent unique ID
      const appId = `app_part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newApp = {
        id: appId,
        type: 'partner',
        name: representativeFullName,
        first_name: firstName,
        last_name: lastName,
        company: formData.organization,
        organization: formData.organization,
        email: formData.email,
        phone: fullPhone,
        designation: formData.designation,
        country: formData.country,
        city: finalPersonalCity,
        personal_country: formData.country,
        personal_city: finalPersonalCity,
        org_country: formData.org_country,
        org_city: finalOrgCity,
        organization_country: formData.org_country,
        organization_city: finalOrgCity,
        website: formData.website,
        partnership_type: formData.partnership_type,
        message: formData.proposal,
        proposal: formData.proposal,
        timeline_or_goals: formData.timeline_or_goals,
        date: new Date().toISOString(),
        status: 'Pending'
      };

      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appId,
          name: representativeFullName,
          first_name: firstName,
          last_name: lastName,
          organization: formData.organization,
          email: formData.email,
          phone: fullPhone,
          designation: formData.designation,
          country: formData.country,
          city: finalPersonalCity,
          personal_country: formData.country,
          personal_city: finalPersonalCity,
          org_country: formData.org_country,
          org_city: finalOrgCity,
          organization_country: formData.org_country,
          organization_city: finalOrgCity,
          website: formData.website,
          partnership_type: formData.partnership_type,
          proposal: formData.proposal,
          timeline_or_goals: formData.timeline_or_goals,
          recaptchaToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Backend partner endpoint warning:', errorData.error);
      }

      // 2. Save to local storage for administrative portal sync with deduplication
      const apps = JSON.parse(localStorage.getItem('ain_applications') || '[]');
      const filtered = apps.filter((a: any) => 
        a.id !== appId && 
        !(a.email && a.email.toLowerCase() === formData.email.toLowerCase() && a.type === 'partner')
      );
      filtered.unshift(newApp);
      localStorage.setItem('ain_applications', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));

      setIsSubmitted(true);
      toast.success('Your partnership proposal has been submitted successfully!');
    } catch (err: any) {
      console.error('Partner submission error:', err);
      toast.error('Something went wrong. Please try again.');
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Become a Partner | ESPA Foundation</title>
        <meta name="description" content="Collaborate with ESPA Foundation to expand educational access, donate technological equipment, and drive measurable social impact." />
        <meta property="og:title" content="Become a Partner | ESPA Foundation" />
        <meta property="og:description" content="Collaborate with ESPA Foundation to expand educational access, donate technological equipment, and drive measurable social impact." />
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
            Become a Partner
          </h1>
          <p className="font-sans text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto text-center">
            <span className="block">Collaborate with ESPA Foundation to expand educational equity,</span>
            <span className="block">donate technology, and drive measurable social impact.</span>
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
                Thank you for your proposal!
              </h2>
              <p className="text-stone-600 mb-2 leading-relaxed">
                Thank you, <span className="font-semibold text-stone-900">{representativeFullName || 'Representative'}</span>, and the leadership at <span className="font-semibold text-[#003828]">{formData.organization}</span>.
              </p>
              <p className="text-sm text-stone-500 mb-8 leading-relaxed">
                Our strategic partnerships director will review your proposal and initiate contact at <span className="font-medium text-stone-800">{formData.email}</span> within 2 business days to schedule an exploratory discussion.
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
                      full_name: '',
                      email: '',
                      phone: '',
                      phone_country_code: '+92',
                      designation: '',
                      country: '',
                      city: '',
                      organization: '',
                      website: '',
                      org_country: '',
                      org_city: '',
                      partnership_type: '',
                      proposal: '',
                      timeline_or_goals: ''
                    });
                    setSelectedPersonalCountryCode('');
                    setCustomPersonalCity('');
                    setSelectedOrgCountryCode('');
                    setCustomOrgCity('');
                    setTouched({});
                    setHasSubmittedAttempt(false);
                  }}
                  className="border border-stone-300 text-stone-700 px-6 py-3.5 rounded-full font-bold text-sm hover:bg-stone-50 transition-colors"
                >
                  Submit Another Proposal
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
                  {/* Line 1 - Col 1: Representative Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Representative Full Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      maxLength={70}
                      onChange={handleChange}
                      onBlur={() => markTouched('full_name')}
                      placeholder="Enter Your Full Name"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('full_name')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('full_name') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Line 1 - Col 2: Designation / Role in Organization */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Designation / Role in Organization<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      maxLength={80}
                      onChange={handleChange}
                      onBlur={() => markTouched('designation')}
                      placeholder="Enter Your Designation"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('designation')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('designation') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.designation}
                      </p>
                    )}
                  </div>

                  {/* Line 2 - Col 1: Phone Number with Country Code */}
                  <div>
                    <PhoneCountryInput
                      id="partner-phone"
                      name="phone"
                      label="Phone Number"
                      required
                      phoneCode={formData.phone_country_code || '+92'}
                      onPhoneCodeChange={(code) => setFormData(prev => ({ ...prev, phone_country_code: code }))}
                      phoneNumber={formData.phone}
                      onPhoneNumberChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                      placeholder="Enter phone number"
                      error={shouldShowError('phone') ? validationErrors.phone : undefined}
                      onBlur={() => markTouched('phone')}
                    />
                  </div>

                  {/* Line 2 - Col 2: Official Work Email */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Official Work Email<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      maxLength={100}
                      onChange={handleChange}
                      onBlur={() => markTouched('email')}
                      placeholder="Enter Your Work Email"
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

                  {/* Line 3 - Col 1: Country */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Country<span className="text-red-500">*</span>
                    </label>
                    <SearchableDropdown
                      options={countryOptions}
                      value={selectedPersonalCountryCode}
                      onChange={handlePersonalCountrySelect}
                      placeholder="Select Country"
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

                  {/* Line 3 - Col 2: City */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      City<span className="text-red-500">*</span>
                    </label>
                    {availablePersonalCities.length > 0 ? (
                      <SearchableDropdown
                        options={personalCityOptions}
                        value={formData.city}
                        onChange={handlePersonalCitySelect}
                        placeholder={selectedPersonalCountryCode ? 'Select City' : 'Select Country First'}
                        searchPlaceholder="Search city..."
                        disabled={!selectedPersonalCountryCode}
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
                        value={customPersonalCity}
                        maxLength={100}
                        onChange={(e) => {
                          setCustomPersonalCity(e.target.value);
                          markTouched('city');
                        }}
                        onBlur={() => markTouched('city')}
                        placeholder={selectedPersonalCountryCode ? 'Enter Your City' : 'Select Country First'}
                        disabled={!selectedPersonalCountryCode}
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

                  {/* Custom Personal City Input if Other / Not Listed is selected */}
                  {availablePersonalCities.length > 0 && formData.city === 'Other / Not Listed' && (
                    <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-1">
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                        Enter Your City Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customPersonalCity}
                        maxLength={100}
                        onChange={(e) => {
                          setCustomPersonalCity(e.target.value);
                          markTouched('city');
                        }}
                        onBlur={() => markTouched('city')}
                        placeholder="Enter Your City Name"
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

              {/* Section 2: Organization Details */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                  Organization Details<span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Organization Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Organization / Company Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      maxLength={120}
                      onChange={handleChange}
                      onBlur={() => markTouched('organization')}
                      placeholder="Enter Your Organization Name"
                      required
                      className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                        shouldShowError('organization')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                    {shouldShowError('organization') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.organization}
                      </p>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Official Website or Corporate Profile
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="Enter Your Website or Corporate Profile"
                      className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400"
                    />
                  </div>

                  {/* Headquarters Country (Unlinked from Personal) */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Headquarters Country<span className="text-red-500">*</span>
                    </label>
                    <SearchableDropdown
                      options={countryOptions}
                      value={selectedOrgCountryCode}
                      onChange={handleOrgCountrySelect}
                      placeholder="Select Headquarters Country"
                      searchPlaceholder="Search country..."
                      error={shouldShowError('org_country') ? validationErrors.org_country : undefined}
                      onBlur={() => markTouched('org_country')}
                    />
                    {shouldShowError('org_country') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.org_country}
                      </p>
                    )}
                  </div>

                  {/* Headquarters City (Unlinked from Personal) */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Headquarters City / Base<span className="text-red-500">*</span>
                    </label>
                    {availableOrgCities.length > 0 ? (
                      <SearchableDropdown
                        options={orgCityOptions}
                        value={formData.org_city}
                        onChange={handleOrgCitySelect}
                        placeholder={selectedOrgCountryCode ? 'Select Headquarters City' : 'Select Country First'}
                        searchPlaceholder="Search city..."
                        disabled={!selectedOrgCountryCode}
                        disabledMessage="Select Country First"
                        error={shouldShowError('org_city') ? validationErrors.org_city : undefined}
                        onBlur={() => markTouched('org_city')}
                        allowCustomOption={true}
                        customOptionLabel="Other / Not Listed"
                      />
                    ) : (
                      <input
                        type="text"
                        name="org_city"
                        value={customOrgCity}
                        maxLength={100}
                        onChange={(e) => {
                          setCustomOrgCity(e.target.value);
                          markTouched('org_city');
                        }}
                        onBlur={() => markTouched('org_city')}
                        placeholder={selectedOrgCountryCode ? 'Enter Headquarters City' : 'Select Country First'}
                        disabled={!selectedOrgCountryCode}
                        className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none disabled:bg-stone-50 disabled:text-stone-400 ${
                          shouldShowError('org_city')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      />
                    )}
                    {shouldShowError('org_city') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.org_city}
                      </p>
                    )}
                  </div>

                  {/* Custom Org City Input if Other / Not Listed is selected */}
                  {availableOrgCities.length > 0 && formData.org_city === 'Other / Not Listed' && (
                    <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-1">
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                        Enter Headquarters City Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customOrgCity}
                        maxLength={100}
                        onChange={(e) => {
                          setCustomOrgCity(e.target.value);
                          markTouched('org_city');
                        }}
                        onBlur={() => markTouched('org_city')}
                        placeholder="Enter Headquarters City Name"
                        className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none ${
                          shouldShowError('org_city')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      />
                      {shouldShowError('org_city') && (
                        <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                          {validationErrors.org_city}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Partnership Category */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Partnership Category<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="partnership_type"
                        value={formData.partnership_type}
                        onChange={handleChange}
                        onBlur={() => markTouched('partnership_type')}
                        required
                        className={`w-full pl-4 pr-11 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs focus:outline-none appearance-none cursor-pointer ${
                          shouldShowError('partnership_type')
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                        }`}
                      >
                        <option value="" disabled>Select Partnership Category</option>
                        <option value="Corporate CSR">Corporate Social Responsibility (CSR)</option>
                        <option value="Academic Institution">Academic & Educational Institution</option>
                        <option value="Technology & Hardware In-Kind">Technology & Hardware In-Kind Donation</option>
                        <option value="Non-Profit Alliance">Non-Governmental / Non-Profit Alliance</option>
                        <option value="Foundation Grant">Philanthropic Foundation & Grantmaker</option>
                        <option value="Other">Other Strategic Initiative</option>
                      </select>
                      <ChevronDown 
                        size={18} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
                      />
                    </div>
                    {shouldShowError('partnership_type') && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.partnership_type}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Partnership Proposal & Scope */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                  Partnership Proposal & Scope<span className="text-red-500">*</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Partnership Proposal & Scope of Work<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="proposal"
                    value={formData.proposal}
                    onChange={handleChange}
                    onBlur={() => markTouched('proposal')}
                    rows={5}
                    required
                    placeholder="Enter Your Partnership Proposal and Scope of Work"
                    className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 focus:outline-none resize-none ${
                      shouldShowError('proposal')
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                    }`}
                  />
                  {shouldShowError('proposal') && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                      {validationErrors.proposal}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Estimated Timeline, Target Locations, or In-Kind Resources
                  </label>
                  <textarea
                    name="timeline_or_goals"
                    value={formData.timeline_or_goals}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter Estimated Timeline, Target Locations, or In-Kind Resources (Optional)"
                    className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* reCAPTCHA verification */}
              <div className="pt-2 flex flex-col items-center sm:items-start">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                />
              </div>

              {/* Submit & Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="border border-stone-300 text-stone-600 bg-white px-6 py-3.5 rounded-full font-bold text-sm tracking-wide hover:text-red-600 hover:border-red-300 hover:bg-red-50/50 transition-colors cursor-pointer shadow-2xs"
                  >
                    Discard
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
                      Submit Proposal
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
