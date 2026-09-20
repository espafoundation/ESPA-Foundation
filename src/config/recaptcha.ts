// Google reCAPTCHA v2 configuration
// Official ESPA Foundation site key (can be overridden via VITE_RECAPTCHA_SITE_KEY)
export const RECAPTCHA_SITE_KEY: string = 
  (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || '6Ldfc8UtAAAAAF5iEA_uC8iWHkDt_BG5VxSC33LO';
