for file in src/components/*.jsx; do
  if grep -q 'h-full flex flex-col tracking-tight relative overflow-hidden' "$file"; then
    # Replace space-y-8 or space-y-6 with space-y-0
    sed -i 's/space-y-[0-9] h-full/space-y-0 h-full/g' "$file"
    
    # Standardize the flex container for the header
    sed -i 's/shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4/flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0/g' "$file"
    sed -i 's/flex items-center gap-4/flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0/g' "$file"

    # Replace <div className="relative"> (the search bar container) with <div className="relative mb-6">
    # We must be careful not to match all relative divs. So we only do it if it precedes the <Search ...
    sed -i '/<Search/!b; {x;s/className="relative"/className="relative mb-6"/;x;H;d}; x;p' "$file" # This is risky with sed, let's use a safer replacement.
  fi
done
