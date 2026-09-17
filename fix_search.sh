for file in src/components/*.jsx; do
  # Add the Search icon back where it's missing
  sed -i '/<div className="relative mb-6">/!b;n;/<Search/b;i\        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />' "$file"
done
