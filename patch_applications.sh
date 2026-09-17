sed -i '/<tbody className="divide-y divide-stone-100">/!b;n;/{filteredApps.length === 0 ? (/!b;n;n;n;n;n;c\
              {filteredApps.length === 0 ? null : filteredApps.map(app => (
' src/components/ApplicationsView.jsx

sed -i '/<table className="w-full text-left border-collapse">/i\
          {filteredApps.length === 0 ? (\
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">\
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Applications Found</h3>\
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>\
            </div>\
          ) : (' src/components/ApplicationsView.jsx

sed -i '/<\/table>/a\
          )}' src/components/ApplicationsView.jsx
