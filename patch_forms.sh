sed -i '/<tbody className="divide-y divide-stone-100">/!b;n;/{filteredForms.map(form => {/!b;c\
              {filteredForms.map(form => {
' src/components/FormsView.jsx

sed -i '/<table className="w-full text-left border-collapse min-w-\[900px\]">/i\
          {filteredForms.length === 0 ? (\
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">\
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Forms Found</h3>\
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>\
            </div>\
          ) : (' src/components/FormsView.jsx

sed -i '/<\/table>/a\
          )}' src/components/FormsView.jsx
