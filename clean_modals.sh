sed -i '/const apps = JSON.parse(localStorage.getItem('\''ain_applications'\'') || '\''\[\]'\'');/,/localStorage.setItem('\''ain_applications'\'', JSON.stringify(apps));/ {
  /type: '\''volunteer'\''/d
  /type: '\''ambassador'\''/d
}' src/components/Modals.tsx
