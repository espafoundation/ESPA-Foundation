sed -i '/const response = await fetch('\''\/api\/partner'\''/i\
                      const apps = JSON.parse(localStorage.getItem('\''ain_applications'\'') || '\'[]\'');\
                      apps.unshift({ \
                        id: Date.now().toString(), \
                        type: '\''partner'\'', \
                        name: formData.get('\''name'\''), \
                        email: formData.get('\''email'\''), \
                        company: formData.get('\''organization'\''), \
                        message: formData.get('\''proposal'\''), \
                        date: new Date().toISOString(), \
                        status: '\''Pending'\''\
                      });\
                      localStorage.setItem('\''ain_applications'\'', JSON.stringify(apps));\
                      window.dispatchEvent(new Event('\''storage'\''));\
' src/components/Modals.tsx

sed -i '/const response = await fetch('\''\/api\/volunteer'\''/i\
                      const apps = JSON.parse(localStorage.getItem('\''ain_applications'\'') || '\'[]\'');\
                      apps.unshift({ \
                        id: Date.now().toString(), \
                        type: '\''volunteer'\'', \
                        name: formData.get('\''name'\''), \
                        email: formData.get('\''email'\''), \
                        area_of_interest: formData.get('\''area_of_interest'\''), \
                        availability: formData.get('\''availability'\''), \
                        date: new Date().toISOString(), \
                        status: '\''Pending'\''\
                      });\
                      localStorage.setItem('\''ain_applications'\'', JSON.stringify(apps));\
                      window.dispatchEvent(new Event('\''storage'\''));\
' src/components/Modals.tsx

sed -i '/const response = await fetch('\''\/api\/ambassador'\''/i\
                      const apps = JSON.parse(localStorage.getItem('\''ain_applications'\'') || '\'[]\'');\
                      apps.unshift({ \
                        id: Date.now().toString(), \
                        type: '\''ambassador'\'', \
                        name: formData.name, \
                        email: formData.email, \
                        phone: formData.phone,\
                        company: '\'\'',\
                        message: formData.motivation,\
                        date: new Date().toISOString(), \
                        status: '\''Pending'\'' \
                      });\
                      localStorage.setItem('\''ain_applications'\'', JSON.stringify(apps));\
                      window.dispatchEvent(new Event('\''storage'\''));\
' src/components/Modals.tsx
