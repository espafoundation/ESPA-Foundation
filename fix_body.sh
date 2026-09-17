sed -i '/name: formData.get('\''name'\'')/,/recaptchaToken/c\
                          name: formData.get('\''name'\''),\
                          organization: formData.get('\''organization'\''),\
                          email: formData.get('\''email'\''),\
                          proposal: formData.get('\''proposal'\''),\
                          recaptchaToken\
' src/components/Modals.tsx

sed -i '/name: formData.get('\''name'\'')/,/recaptchaToken/c\
                          name: formData.get('\''name'\''),\
                          email: formData.get('\''email'\''),\
                          area_of_interest: formData.get('\''area_of_interest'\''),\
                          availability: formData.get('\''availability'\''),\
                          recaptchaToken\
' src/components/Modals.tsx

# For Ambassador, I need to restore recaptchaToken
sed -i 's/...formData,/...formData,\n                          recaptchaToken/g' src/components/Modals.tsx
