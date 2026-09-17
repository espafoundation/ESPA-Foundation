sed -i '337,337c\
                      setSubmitted(true);\
                      toast.success('\''Submitted successfully!'\'');\
                    } catch (err: any) {\
                      console.error(err);\
                      toast.error(err.message || '\''Something went wrong. Please try again.'\'');\
                      if (btn) btn.textContent = '\''Apply Now'\'';\
                      recaptchaRef.current?.reset();\
                    }\
                  }} className="flex flex-col gap-4 flex-1">\
                    <div>\
                      <input ' src/components/Modals.tsx

# Also, for ambassador, line 507 has the duplicate localStorage.setItem('ain_applications', JSON.stringify(apps));
# I should remove that.
sed -i '507,507d' src/components/Modals.tsx

