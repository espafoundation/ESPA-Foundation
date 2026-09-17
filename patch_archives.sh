sed -i '/<table className="w-full text-left border-collapse">/i\
          {activeData.length === 0 ? (\
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">\
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Archives Found</h3>\
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>\
            </div>\
          ) : (' src/components/ArchivesView.jsx

sed -i '/<\/table>/a\
          )}' src/components/ArchivesView.jsx

sed -i '/activeData.length === 0 ? (/d' src/components/ArchivesView.jsx
sed -i 's/<tr><td colSpan="2" className="px-6 py-8 text-center text-stone-500 text-sm">No Data Available.<\/td><\/tr>//g' src/components/ArchivesView.jsx
