import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { Country, City } from 'country-state-city';
import { 
  CheckCircle2, 
  ArrowLeft, 
  Send, 
  ShieldCheck, 
  FolderPlus, 
  Plus, 
  X,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  Mail,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import SearchableDropdown, { DropdownOption } from '../components/SearchableDropdown';
import PhoneCountryInput from '../components/PhoneCountryInput';
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha';

interface LanguageSkill {
  language: string;
  fluency: 'Native / Bilingual' | 'Fluent' | 'Conversational' | 'Basic';
}

const STORAGE_KEY = 'espa_volunteer_form_draft';

export default function Volunteer() {
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

  const handleGoHome = () => {
    sessionStorage.removeItem('espa_restore_target');
    sessionStorage.removeItem('espa_last_section');
    sessionStorage.removeItem('espa_scroll_/');
    navigate('/');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);
  };

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Email verification (OTP) states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cachedRecaptchaToken, setCachedRecaptchaToken] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    phone_country_code: '+92',
    whatsapp: '',
    whatsapp_country_code: '+92',
    password: '',
    confirm_password: '',
    gender: '',
    dob: '',
    city: '',
    country: '',
    availability: '',
    motivation: ''
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [customCity, setCustomCity] = useState('');

  // Comprehensive country list excluding Israel
  const allCountries = useMemo(() => {
    return Country.getAllCountries()
      .filter(c => c.name.toLowerCase() !== 'israel' && c.isoCode !== 'IL')
      .map(c => ({
        isoCode: c.isoCode,
        name: (c.name.includes('Palestinian Territory') || c.name.includes('Palestine')) ? 'Palestine' : c.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Country dropdown options for SearchableDropdown
  const countryOptions: DropdownOption[] = useMemo(() => {
    return allCountries.map(c => ({
      value: c.isoCode,
      label: c.name
    }));
  }, [allCountries]);

  // Cities matching the selected country
  const availableCities = useMemo(() => {
    if (!selectedCountryCode) return [];
    const rawCities = City.getCitiesOfCountry(selectedCountryCode) || [];
    const uniqueNames = Array.from(new Set(rawCities.map(c => (c?.name || '').trim()))).filter(Boolean);
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [selectedCountryCode]);

  // City dropdown options for SearchableDropdown
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

  // Languages list initialized empty (no pre-selected languages)
  const [languages, setLanguages] = useState<LanguageSkill[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [fluencyInput, setFluencyInput] = useState<LanguageSkill['fluency']>('Fluent');

  // Multi-select organization targets: neither selected by default
  const [targets, setTargets] = useState<{ foundation: boolean; library: boolean }>({
    foundation: false,
    library: false
  });
  const [libraryRole, setLibraryRole] = useState<'Moderator' | 'Curator' | ''>('');

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Real-time validation errors object
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Full Name
    if (!formData.full_name?.trim()) {
      errs.full_name = 'Full Name is required';
    } else if (formData.full_name.trim().length < 2) {
      errs.full_name = 'Full Name must be at least 2 characters';
    } else if (formData.full_name.length > 100) {
      errs.full_name = 'Full Name cannot exceed 100 characters';
    }

    // Email
    if (!formData.email?.trim()) {
      errs.email = 'Email Address is required';
    } else if (!formData.email.includes('@')) {
      errs.email = 'Email Address must include an "@" symbol';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@example.com)';
    } else if (formData.email.length > 100) {
      errs.email = 'Email Address cannot exceed 100 characters';
    }

    // Phone
    if (!formData.phone?.trim()) {
      errs.phone = 'Phone Number is required';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 6) {
      errs.phone = 'Please enter a valid phone number';
    } else if (formData.phone.length > 25) {
      errs.phone = 'Phone Number cannot exceed 25 characters';
    }

    // WhatsApp
    if (!formData.whatsapp?.trim()) {
      errs.whatsapp = 'WhatsApp Number is required';
    } else if (formData.whatsapp.replace(/[^0-9]/g, '').length < 6) {
      errs.whatsapp = 'Please enter a valid WhatsApp number';
    } else if (formData.whatsapp.length > 25) {
      errs.whatsapp = 'WhatsApp Number cannot exceed 25 characters';
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
      errs.password = 'Password must include at least 1 symbol (e.g. !@#$%^&*)';
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
    if (!formData.country) {
      errs.country = 'Country is required';
    }

    // City
    const effectiveCity = formData.city === 'Other / Not Listed' || availableCities.length === 0
      ? (customCity || '').trim()
      : (formData.city || '').trim();
    if (!effectiveCity) {
      errs.city = 'City is required';
    } else if (effectiveCity.length > 100) {
      errs.city = 'City cannot exceed 100 characters';
    }

    // Languages
    if (languages.length === 0) {
      errs.languages = 'At least one language is required';
    }

    // Targets
    if (!targets.foundation && !targets.library) {
      errs.targets = 'Please select where you would like to volunteer';
    }

    // Library role
    if (targets.library && !libraryRole) {
      errs.libraryRole = 'Please select whether you want to apply as a Moderator or Curator';
    }

    // Availability
    if (!formData.availability) {
      errs.availability = 'Weekly availability is required';
    }

    // Motivation
    if (!formData.motivation?.trim()) {
      errs.motivation = 'Reason for volunteering is required';
    } else if (formData.motivation.trim().length > 1000) {
      errs.motivation = 'Reason cannot exceed 1000 characters';
    }

    return errs;
  }, [formData, customCity, availableCities.length, languages.length, targets, libraryRole]);

  // Determine whether to display error for a given field (only appears after user clicked Submit)
  const shouldShowError = (field: string) => {
    return hasSubmittedAttempt && !!validationErrors[field];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountrySelect = (isoCode: string) => {
    const countryObj = allCountries.find(c => c.isoCode === isoCode);
    setSelectedCountryCode(isoCode);
    setFormData(prev => ({
      ...prev,
      country: countryObj ? countryObj.name : '',
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

  const toggleTarget = (key: 'foundation' | 'library') => {
    setTargets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    markTouched('targets');
  };

  const handleAddLanguage = () => {
    const lang = languageInput.trim();
    if (!lang) return;

    if (lang.length > 50) {
      toast.error('Language name cannot exceed 50 characters.');
      return;
    }

    const exists = languages.some(l => l.language.toLowerCase() === lang.toLowerCase());
    if (exists) {
      toast.error(`${lang} is already added.`);
      return;
    }

    setLanguages(prev => [...prev, { language: lang, fluency: fluencyInput }]);
    setLanguageInput('');
    setFluencyInput('Fluent');
    markTouched('languages');
  };

  const handleRemoveLanguage = (indexToRemove: number) => {
    setLanguages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    markTouched('languages');
  };

  const handleKeyDownLanguage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLanguage();
    }
  };

  // 1. Restore draft from local storage on mount (auto-expire if not returned within 48 hours)
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        const savedTime = parsed.savedAt ? new Date(parsed.savedAt).getTime() : 0;
        const now = Date.now();
        const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

        // Auto-remove draft if user did not return within 48 hours
        if (!savedTime || (now - savedTime) > FORTY_EIGHT_HOURS_MS) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        if (parsed.formData) {
          const loadedFullName = parsed.formData.full_name || 
            (parsed.formData.first_name ? `${parsed.formData.first_name} ${parsed.formData.last_name || ''}`.trim() : '');
          setFormData(prev => ({
            ...prev,
            full_name: loadedFullName,
            email: parsed.formData.email || '',
            phone: parsed.formData.phone || '',
            phone_country_code: parsed.formData.phone_country_code || '+92',
            whatsapp: parsed.formData.whatsapp || '',
            whatsapp_country_code: parsed.formData.whatsapp_country_code || '+92',
            password: parsed.formData.password || '',
            confirm_password: parsed.formData.confirm_password || '',
            gender: parsed.formData.gender || '',
            dob: parsed.formData.dob || '',
            city: parsed.formData.city || '',
            country: parsed.formData.country || '',
            availability: parsed.formData.availability || '',
            motivation: parsed.formData.motivation || ''
          }));
        }
        if (parsed.targets || parsed.libraryRole) {
          delete parsed.targets;
          delete parsed.libraryRole;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (e) {
            // ignore
          }
        }
        if (parsed.selectedCountryCode) setSelectedCountryCode(parsed.selectedCountryCode);
        if (parsed.customCity) setCustomCity(parsed.customCity);
        if (Array.isArray(parsed.languages)) setLanguages(parsed.languages);
        // Targets intentionally not restored to ensure nothing is pre-selected by default
        setTargets({ foundation: false, library: false });
        setLibraryRole('');
      }
    } catch (err) {
      console.error('Error loading volunteer form draft:', err);
    }
  }, []);

  // 2. Auto-save form draft to local storage on change (debounced 500ms) with timestamp
  useEffect(() => {
    if (isSubmitted || isVerifyingEmail) return;

    const hasAnyContent = Boolean(
      formData.full_name || formData.email || formData.phone ||
      formData.whatsapp ||
      formData.password || formData.confirm_password || formData.gender || formData.dob ||
      formData.city || formData.country || formData.availability || formData.motivation ||
      languages.length > 0 || targets.foundation || targets.library
    );

    if (!hasAnyContent) return;

    const timer = setTimeout(() => {
      try {
        const draft = {
          formData,
          selectedCountryCode,
          customCity,
          languages,
          targets,
          libraryRole,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (err) {
        console.error('Error saving volunteer form draft:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, selectedCountryCode, customCity, languages, targets, libraryRole, isSubmitted, isVerifyingEmail]);

  // Clear auto-saved draft
  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      phone_country_code: '+92',
      whatsapp: '',
      whatsapp_country_code: '+92',
      password: '',
      confirm_password: '',
      gender: '',
      dob: '',
      city: '',
      country: '',
      availability: '',
      motivation: ''
    });
    setSelectedCountryCode('');
    setCustomCity('');
    setLanguages([]);
    setTargets({ foundation: false, library: false });
    setLibraryRole('');
    setTouched({});
    setHasSubmittedAttempt(false);
    recaptchaRef.current?.reset();
    toast.success('Form draft cleared.');
  };

  // OTP resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // OTP digit handlers
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...enteredOtp];
    newOtp[index] = digit;
    setEnteredOtp(newOtp);
    setOtpError('');

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setEnteredOtp(newOtp);
    setOtpError('');
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError('');

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          recaptchaToken: cachedRecaptchaToken || 'verified_token',
          purpose: 'volunteer_application'
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }

      setEnteredOtp(['', '', '', '', '', '']);
      setResendCooldown(60);
      otpInputRefs.current[0]?.focus();
      toast.success(`A new verification code was sent to ${formData.email}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmittedAttempt(true);

    // Validate form
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || 'Please fill in all mandatory fields.');
      return;
    }

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      toast.error('Please verify that you are not a robot.');
      return;
    }

    setIsSubmitting(true);
    setCachedRecaptchaToken(recaptchaToken);

    try {
      // Real-time OTP sender to applicant's email address
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          recaptchaToken,
          purpose: 'volunteer_application'
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code. Please check your email address.');
      }

      setEnteredOtp(['', '', '', '', '', '']);
      setOtpError('');
      setResendCooldown(60);
      setIsVerifyingEmail(true);
      toast.success(`Verification code sent to ${formData.email}! Please check your inbox.`);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      toast.error(err.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeAccount = async () => {
    const fullOtp = enteredOtp.join('').trim();
    if (fullOtp.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsFinalizing(true);
    setOtpError('');

    try {
      // Validate OTP with server-side validator
      const verifyRes = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: fullOtp
        })
      });

      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyData.valid) {
        setOtpError(verifyData.error || 'Invalid or expired verification code. Please try again.');
        setIsFinalizing(false);
        return;
      }

      const effectiveCity = formData.city === 'Other / Not Listed' || availableCities.length === 0
        ? (customCity || '').trim()
        : (formData.city || '').trim();

      const fullName = (formData.full_name || '').trim();
      const firstName = fullName.split(/\s+/)[0] || '';
      const lastName = fullName.split(/\s+/).slice(1).join(' ') || '';
      const fullPhone = `${formData.phone_country_code || '+92'} ${formData.phone || ''}`.trim();
      const fullWhatsApp = `${formData.whatsapp_country_code || '+92'} ${formData.whatsapp || ''}`.trim();

      const volunteerTargetText = targets.foundation && targets.library
        ? 'ESPA Foundation & ESPA Digital Library (Both)'
        : (targets.library ? 'ESPA Digital Library' : 'ESPA Foundation');

      let computedArea = '';
      if (targets.foundation && targets.library) {
        computedArea = `ESPA Foundation & Digital Library (${libraryRole})`;
      } else if (targets.library) {
        computedArea = `Digital Library (${libraryRole})`;
      } else {
        computedArea = 'ESPA Foundation';
      }

      const formattedLanguages = languages.map(l => `${l.language} (${l.fluency})`);
      const appId = `app_vol_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      const newAppRecord = {
        id: appId,
        type: 'volunteer',
        name: fullName,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        phone: fullPhone,
        phone_country_code: formData.phone_country_code || '+92',
        phone_number: formData.phone,
        whatsapp: fullWhatsApp,
        whatsapp_country_code: formData.whatsapp_country_code || '+92',
        whatsapp_number: formData.whatsapp,
        password: formData.password,
        gender: formData.gender,
        dob: formData.dob,
        city: effectiveCity,
        country: formData.country,
        volunteer_target: volunteerTargetText,
        library_role: targets.library ? libraryRole : '',
        languages: formattedLanguages,
        area_of_interest: computedArea,
        availability: formData.availability,
        message: formData.motivation,
        date: new Date().toISOString(),
        status: 'Pending',
        emailVerified: true
      };

      // 1. Dispatch to backend API with consistent unique ID
      const response = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appId,
          name: fullName,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: fullPhone,
          phone_country_code: formData.phone_country_code || '+92',
          phone_number: formData.phone,
          whatsapp: fullWhatsApp,
          whatsapp_country_code: formData.whatsapp_country_code || '+92',
          whatsapp_number: formData.whatsapp,
          password: formData.password,
          gender: formData.gender,
          dob: formData.dob,
          city: effectiveCity,
          country: formData.country,
          volunteer_target: volunteerTargetText,
          library_role: targets.library ? libraryRole : '',
          languages: formattedLanguages,
          area_of_interest: computedArea,
          availability: formData.availability,
          message: formData.motivation,
          recaptchaToken: cachedRecaptchaToken || 'verified_token'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save your volunteer application. Please try again.');
      }

      // The server/Supabase is the source of truth.
      // Do not save applications to localStorage.
      window.dispatchEvent(new Event('ain_refresh_applications'));

      // Clear the local storage draft once finalized!
      localStorage.removeItem(STORAGE_KEY);

      setIsVerifyingEmail(false);
      setIsSubmitted(true);
      toast.success('Email verified! Your volunteer application has been submitted successfully.');
    } catch (err: any) {
      console.error('Volunteer submission error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const getTargetSummary = () => {
    if (targets.foundation && targets.library) {
      return `ESPA Foundation & ESPA Digital Library (${libraryRole})`;
    }
    if (targets.library) {
      return `ESPA Digital Library (${libraryRole})`;
    }
    return 'ESPA Foundation';
  };

  const candidateFullName = formData.full_name?.trim() || '';

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Become a Volunteer | ESPA Foundation</title>
        <meta name="description" content="Join our mission as a volunteer at ESPA Foundation or ESPA Digital Library. Empower communities through education and open digital access." />
        <meta property="og:title" content="Become a Volunteer | ESPA Foundation" />
        <meta property="og:description" content="Join our mission as a volunteer at ESPA Foundation or ESPA Digital Library. Empower communities through education and open digital access." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
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
            Become a Volunteer
          </h1>
          <p className="font-sans text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl mx-auto text-center">
            <span className="block">Join our mission to empower communities</span>
            <span className="block">through education and open access to knowledge.</span>
          </p>
        </div>

        {/* Form or Confirmation Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-10 md:p-12">
          {isSubmitted ? (
            /* Thank you success screen replacing form content */
            <div className="text-center py-12 px-4 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-[#003828]/10 text-[#003828] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={44} className="text-[#003828]" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                Application Submitted!
              </h2>
              <p className="text-stone-600 mb-2 leading-relaxed">
                Thank you, <span className="font-semibold text-stone-900">{candidateFullName || 'Applicant'}</span>, for applying to volunteer with <span className="font-semibold text-[#003828]">ESPA Foundation</span>.
              </p>
              <p className="text-sm text-stone-500 mb-8 leading-relaxed">
                Your application has been successfully received and will be reviewed shortly. You will receive an email at <span className="font-medium text-stone-800">{formData.email}</span> with an update on the status of your application and any further information regarding the next steps.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="bg-[#003828] text-white border border-[#003828] px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all text-center inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Home
                </button>
              </div>
            </div>
          ) : isVerifyingEmail ? (
            /* Real-Time Email Verification Step (OTP) */
            <div className="py-6 sm:py-8 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#003828]/10 text-[#003828] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <Mail size={32} />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
                  Verify Your Email
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  We have sent a 6-digit verification code to <span className="font-semibold text-stone-900">{formData.email}</span>. Please enter the code below to finalize your volunteer application.
                </p>
              </div>

              {/* 6-Digit Input Grid */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider text-center">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {enteredOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold font-mono rounded-xl border bg-white shadow-xs focus:outline-none transition-all ${
                        otpError 
                          ? 'border-red-500 ring-1 ring-red-500 text-red-600' 
                          : digit 
                            ? 'border-[#003828] text-[#003828] ring-1 ring-[#003828]/30' 
                            : 'border-stone-200 text-stone-900 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-xs text-red-600 font-medium text-center animate-in fade-in">
                    {otpError}
                  </p>
                )}

                {/* Finalize Account Button */}
                <button
                  type="button"
                  onClick={handleFinalizeAccount}
                  disabled={isFinalizing || enteredOtp.join('').length < 6}
                  className="w-full mt-4 py-3.5 px-6 bg-[#003828] text-white rounded-xl text-sm font-bold border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isFinalizing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying & Finalizing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Verify & Finalize Application</span>
                    </>
                  )}
                </button>

                {/* Return to Edit Form & Resend Options */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingEmail(false);
                      setOtpError('');
                    }}
                    className="text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Edit Application Details
                  </button>

                  <div>
                    {resendCooldown > 0 ? (
                      <span className="text-stone-400">Resend code in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="text-[#003828] hover:text-[#00261B] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw size={13} className={isResending ? 'animate-spin' : ''} />
                        {isResending ? 'Sending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                  Personal Information<span className="text-red-500">*</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Full Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      maxLength={100}
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
                    <PhoneCountryInput
                      id="volunteer-phone"
                      name="phone"
                      label="Phone Number"
                      phoneCode={formData.phone_country_code}
                      onPhoneCodeChange={(code) => setFormData(prev => ({ ...prev, phone_country_code: code }))}
                      phoneNumber={formData.phone}
                      onPhoneNumberChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                      placeholder="Enter phone number"
                      required
                      error={shouldShowError('phone') ? validationErrors.phone : undefined}
                      onBlur={() => markTouched('phone')}
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <PhoneCountryInput
                      id="volunteer-whatsapp"
                      name="whatsapp"
                      label="WhatsApp Number"
                      phoneCode={formData.whatsapp_country_code}
                      onPhoneCodeChange={(code) => setFormData(prev => ({ ...prev, whatsapp_country_code: code }))}
                      phoneNumber={formData.whatsapp}
                      onPhoneNumberChange={(val) => setFormData(prev => ({ ...prev, whatsapp: val }))}
                      placeholder="Enter WhatsApp number"
                      required
                      error={shouldShowError('whatsapp') ? validationErrors.whatsapp : undefined}
                      onBlur={() => markTouched('whatsapp')}
                    />
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
                        placeholder="Create a password"
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
                        placeholder="Confirm your password"
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

                  {/* Searchable Country Dropdown */}
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

                  {/* Searchable City Dropdown or Custom Input */}
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

                  {/* Custom City Input when user selects "Other / Not Listed" */}
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

              {/* Languages Section */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                    Languages<span className="text-red-500">*</span>
                  </h3>
                </div>

                {/* Added Language Chips with Fluency - (Placeholder text note removed per user instruction) */}
                {languages.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2.5 bg-stone-50/80 rounded-xl border border-stone-200/80 mb-2 animate-in fade-in">
                    {languages.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-white text-stone-900 border border-stone-200 shadow-2xs transition-all animate-in fade-in"
                      >
                        <span className="font-semibold text-[#003828]">{item.language}</span>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#003828]/10 text-[#003828] border border-[#003828]/20">
                          {item.fluency}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(idx)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-0.5 rounded-sm cursor-pointer"
                          title={`Remove ${item.language}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input row with Language and Fluency Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Language<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={languageInput}
                      maxLength={50}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyDown={handleKeyDownLanguage}
                      placeholder="Enter Language"
                      className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Fluency Level<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={fluencyInput}
                        onChange={(e) => setFluencyInput(e.target.value as LanguageSkill['fluency'])}
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] text-stone-900 text-sm font-medium transition-all shadow-xs appearance-none cursor-pointer"
                      >
                        <option value="Native / Bilingual">Native / Bilingual</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Conversational">Conversational</option>
                        <option value="Basic">Basic</option>
                      </select>
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      disabled={!(languageInput || '').trim()}
                      className="w-full py-2.5 bg-[#003828] text-white text-xs font-bold rounded-xl border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>
                </div>

                {shouldShowError('languages') && (
                  <p className="mt-1 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                    {validationErrors.languages}
                  </p>
                )}
              </div>

              {/* Organization Selection: neither selected by default */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div>
                  <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider mb-1">
                    Where Would You Like to Volunteer?<span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Please select at least one organization where you would like to contribute.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                  {/* Option 1: ESPA Foundation (Clickable Card) */}
                  <div
                    onClick={() => toggleTarget('foundation')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleTarget('foundation');
                      }
                    }}
                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none overflow-hidden min-w-0 ${
                      targets.foundation
                        ? 'border-[#003828] bg-[#003828]/5 shadow-xs'
                        : shouldShowError('targets')
                        ? 'border-red-400 bg-red-50/20 hover:border-red-500'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5 min-w-0 w-full">
                      <div className="h-10 min-h-[40px] flex items-center min-w-0 shrink overflow-hidden">
                        <img 
                          src="/ESPA%20Foundation.svg" 
                          alt="ESPA Foundation" 
                          style={{ height: '40px', maxHeight: '40px', maxWidth: '100%', width: 'auto' }}
                          className="h-10 max-h-[40px] w-auto max-w-full object-contain object-left select-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold ${targets.foundation ? 'text-[#003828]' : 'text-stone-400'}`}>
                          {targets.foundation ? 'Selected' : 'Click to select'}
                        </span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          targets.foundation 
                            ? 'bg-[#003828] border-[#003828] text-white' 
                            : 'border-stone-300 bg-white'
                        }`}>
                          {targets.foundation && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Engage in grassroots community initiatives, teaching drives, student mentoring, healthcare camps, and general foundation operations.
                    </p>
                  </div>

                  {/* Option 2: ESPA Digital Library (Clickable Card) */}
                  <div
                    onClick={() => toggleTarget('library')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleTarget('library');
                      }
                    }}
                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none overflow-hidden min-w-0 ${
                      targets.library
                        ? 'border-[#003828] bg-[#003828]/5 shadow-xs'
                        : shouldShowError('targets')
                        ? 'border-red-400 bg-red-50/20 hover:border-red-500'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5 min-w-0 w-full">
                      <div className="h-10 min-h-[40px] flex items-center min-w-0 shrink overflow-hidden">
                        <img 
                          src="/ESPA%20Digital%20Library.svg" 
                          alt="ESPA Digital Library" 
                          style={{ height: '40px', maxHeight: '40px', maxWidth: '100%', width: 'auto' }}
                          className="h-10 max-h-[40px] w-auto max-w-full object-contain object-left select-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold ${targets.library ? 'text-[#003828]' : 'text-stone-400'}`}>
                          {targets.library ? 'Selected' : 'Click to select'}
                        </span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          targets.library 
                            ? 'bg-[#003828] border-[#003828] text-white' 
                            : 'border-stone-300 bg-white'
                        }`}>
                          {targets.library && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Collect, catalog, curate, and preserve open access books and educational literature to make knowledge accessible to every learner.
                    </p>
                  </div>
                </div>

                {shouldShowError('targets') && (
                  <p className="mt-1 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                    {validationErrors.targets}
                  </p>
                )}

                {/* Conditional Question: If Digital Library selected -> Moderator vs Curator */}
                {targets.library && (
                  <div className="pt-4 mt-4 border-t border-dashed border-stone-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 mb-1">
                        What position do you think is the best fit for you?<span className="text-red-500">*</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Moderator Card */}
                      <label
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          libraryRole === 'Moderator'
                            ? 'border-[#003828] bg-[#003828]/5 shadow-xs'
                            : shouldShowError('libraryRole')
                            ? 'border-red-400 bg-red-50/20 hover:border-red-500'
                            : 'border-stone-200/90 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#003828]/10 text-[#003828] flex items-center justify-center">
                                <ShieldCheck size={18} />
                              </div>
                              <span className="font-bold text-stone-900 text-base">Moderator</span>
                            </div>
                            <input
                              type="radio"
                              name="libraryRole"
                              value="Moderator"
                              checked={libraryRole === 'Moderator'}
                              onChange={() => {
                                setLibraryRole('Moderator');
                                markTouched('libraryRole');
                              }}
                              className="w-4 h-4 text-[#003828] focus:ring-[#003828] accent-[#003828]"
                            />
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            Review and approve book submissions, organize catalog categories, and ensure high quality.
                          </p>
                        </div>
                      </label>

                      {/* Curator Card */}
                      <label
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          libraryRole === 'Curator'
                            ? 'border-[#003828] bg-[#003828]/5 shadow-xs'
                            : shouldShowError('libraryRole')
                            ? 'border-red-400 bg-red-50/20 hover:border-red-500'
                            : 'border-stone-200/90 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#003828]/10 text-[#003828] flex items-center justify-center">
                                <FolderPlus size={18} />
                              </div>
                              <span className="font-bold text-stone-900 text-base">Curator</span>
                            </div>
                            <input
                              type="radio"
                              name="libraryRole"
                              value="Curator"
                              checked={libraryRole === 'Curator'}
                              onChange={() => {
                                setLibraryRole('Curator');
                                markTouched('libraryRole');
                              }}
                              className="w-4 h-4 text-[#003828] focus:ring-[#003828] accent-[#003828]"
                            />
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            Find free public-domain books and upload them for review via the website or Google Drive.
                          </p>
                        </div>
                      </label>
                    </div>

                    {shouldShowError('libraryRole') && (
                      <p className="mt-1 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                        {validationErrors.libraryRole}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Availability & Motivation */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="text-[18px] font-bold text-[#003828] uppercase tracking-wider">
                  Availability & Experience<span className="text-red-500">*</span>
                </h3>
                
                {/* Availability */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Weekly Availability<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      onBlur={() => markTouched('availability')}
                      required
                      className={`w-full pl-4 pr-11 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs focus:outline-none appearance-none cursor-pointer ${
                        shouldShowError('availability')
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-stone-200 focus:border-[#003828] focus:ring-1 focus:ring-[#003828]'
                      }`}
                    >
                      <option value="" disabled>Select Weekly Availability</option>
                      <option value="1-5 hours/week">1 - 5 hours / week</option>
                      <option value="5-10 hours/week">5 - 10 hours / week</option>
                      <option value="10+ hours/week">10+ hours / week</option>
                      <option value="Weekends only">Weekends Only</option>
                      <option value="Flexible / As Needed">Flexible / As Needed</option>
                    </select>
                    <ChevronDown 
                      size={18} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
                    />
                  </div>
                  {shouldShowError('availability') && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
                      {validationErrors.availability}
                    </p>
                  )}
                </div>

                {/* Motivation / Reason with Character Limit */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Why Do You Want to Volunteer?<span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-stone-400 font-mono">
                      {formData.motivation.length} / 1000
                    </span>
                  </div>
                  <textarea
                    name="motivation"
                    value={formData.motivation}
                    maxLength={1000}
                    onChange={handleChange}
                    onBlur={() => markTouched('motivation')}
                    rows={4}
                    required
                    placeholder="Enter Your Reason for Volunteering"
                    className={`w-full px-4 py-3.5 bg-white border rounded-xl text-stone-900 text-sm font-medium transition-all shadow-xs placeholder-stone-400 resize-none focus:outline-none ${
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
                  className="bg-[#003828] text-white border border-[#003828] px-8 py-3.5 rounded-full font-bold text-sm tracking-wide hover:bg-white hover:text-[#003828] hover:border-[#003828] disabled:opacity-60 transition-all flex items-center gap-2 shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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

