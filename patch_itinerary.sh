sed -i '/<table className="w-full text-left border-collapse min-w-\[700px\]">/i\
          {filteredUsers.length === 0 ? (\
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">\
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Itinerary Found</h3>\
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>\
            </div>\
          ) : (' src/components/ItineraryView.jsx

sed -i '/<\/table>/a\
          )}' src/components/ItineraryView.jsx
