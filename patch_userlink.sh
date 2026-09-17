sed -i '/const getLvl = (r) => {/,/};/c\
    const getLvl = (r) => {\
        if (r === '\''Admin'\'') return 10;\
        if (r === '\''President'\'') return 9;\
        if (r === '\''Vice President'\'') return 8;\
        if (['\''General Secretary'\'', '\''Joint Secretary'\'', '\''Treasurer'\''].includes(r)) return 7;\
        if (r === '\''Executive Member'\'') return 6;\
        if (['\''General Member'\'', '\''Donor'\'', '\''Partner'\''].includes(r)) return 5;\
        if (['\''Ambassador'\'', '\''Volunteer'\''].includes(r)) return 4;\
        return 0;\
    };' src/components/ManagementPortal.jsx
