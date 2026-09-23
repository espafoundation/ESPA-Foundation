// Google reCAPTCHA v2 configuration
export const RECAPTCHA_SITE_KEY: string = 
  (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || '';
