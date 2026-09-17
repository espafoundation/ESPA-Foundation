import fs from 'fs';
let code = fs.readFileSync('src/components/Modals.tsx', 'utf-8');
code = code.replace(/\.\.\.formData,\s*recaptchaToken/g, 'recaptchaToken');
fs.writeFileSync('src/components/Modals.tsx', code);
