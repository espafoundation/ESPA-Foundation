import React from 'react';
import { PlaneTakeoff, PlaneLanding, Plus, X, Bus, Train, Car , MapPin } from 'lucide-react';
import { countries } from '../management/countries';
import { getCities, getAirportCode } from './managementUtils';

export default function FlightDetailsForm({
  title,
  flightType, // 'arrival' or 'departure'
  state,
  setState,
  isEdit = false
}) {
  // Mapping prefixes based on flightType
  // For arrival (inbound): FROM is arrivalFrom*, TO is arrival*
  // For departure (outbound): FROM is departure*, TO is departureTo*
  const fromPrefix = flightType === 'arrival' ? 'arrivalFrom' : 'departure';
  const toPrefix = flightType === 'arrival' ? 'arrival' : 'departureTo';
  const flightPrefix = flightType === 'arrival' ? 'arrivalFlight' : 'departureFlight';
  const connectingPrefix = flightType === 'arrival' ? 'arrivalConnectingFlights' : 'departureConnectingFlights';

  const updateField = (field, value) => {
    setState({ ...state, [field]: value });
  };

  const getIcon = (transportMode, type, size = 16, className = "") => {
     if (transportMode === 'Bus') return <Bus size={size} className={className} />;
     if (transportMode === 'Train') return <Train size={size} className={className} />;
     if (transportMode === 'Car') return <Car size={size} className={className} />;
     if (transportMode === 'Van') return <Car size={size} className={className} />;
     if (type === 'from' || type === 'departure') return <PlaneTakeoff size={size} className={className} />;
     return <PlaneLanding size={size} className={className} />;
  };
  const mode = state[`${flightType}TransportMode`] || 'Flight';
  const getTransportIcon = (type, size = 16, className = "") => getIcon(mode, type, size, className);


  const handleCountryChange = (type, country) => {
    const prefix = type === 'from' ? fromPrefix : toPrefix;
    updateField(`${prefix}Country`, country);
    // Reset city and airport code
    setState(prev => ({
      ...prev,
      [`${prefix}City`]: '',
      [`${prefix}AirportCode`]: ''
    }));
  };

  const handleCityChange = (type, city) => {
    const prefix = type === 'from' ? fromPrefix : toPrefix;
    const country = state[`${prefix}Country`];
    const iata = getAirportCode(country, city);
    setState(prev => ({
      ...prev,
      [`${prefix}City`]: city,
      [`${prefix}AirportCode`]: iata
    }));
  };

  const addConnectingFlight = () => {
    const newFlight = {
      fromCountry: '', fromCity: '', fromAirportCode: '', fromDate: '', fromTime: '',
      toCountry: '', toCity: '', toAirportCode: '', toDate: '', toTime: '',
      flight: ''
    };
    setState(prev => ({
      ...prev,
      [connectingPrefix]: [...(prev[connectingPrefix] || []), newFlight]
    }));
  };

  const removeConnectingFlight = (idx) => {
    setState(prev => {
      const arr = [...(prev[connectingPrefix] || [])];
      arr.splice(idx, 1);
      return { ...prev, [connectingPrefix]: arr };
    });
  };

  const updateConnectingFlight = (idx, field, value) => {
    setState(prev => {
      const arr = [...(prev[connectingPrefix] || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      
      // Auto-fill airport code if city changes
      if (field === 'fromCity') {
        const iata = getAirportCode(arr[idx].fromCountry, value);
        if (iata) arr[idx].fromAirportCode = iata;
      }
      if (field === 'toCity') {
        const iata = getAirportCode(arr[idx].toCountry, value);
        if (iata) arr[idx].toAirportCode = iata;
      }
      
      return { ...prev, [connectingPrefix]: arr };
    });
  };

  const inputClass = "w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] focus:border-[#003828] outline-none text-sm font-medium text-stone-800 placeholder-stone-400";
  const selectClass = "w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] focus:border-[#003828] outline-none text-sm font-medium text-stone-800 appearance-none";

  const renderLocationBlock = (type, title) => {
    const prefix = type === 'from' ? fromPrefix : toPrefix;
    const country = state[`${prefix}Country`] || '';
    const city = state[`${prefix}City`] || '';
    const airportCode = state[`${prefix}AirportCode`] || '';
    const date = state[`${prefix}Date`] || '';
    const time = state[`${prefix}Time`] || '';

    const availableCities = getCities(country);

    return (
      <div className="space-y-4">
        <h5 className="text-sm font-bold text-[#003828] uppercase tracking-wider flex items-center gap-2">
          {getTransportIcon(type)} {title}
        </h5>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Country</label>
            <select value={country} onChange={e => handleCountryChange(type, e.target.value)} className={selectClass}>
              <option value="">Select Country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">City</label>
              <select value={city} onChange={e => handleCityChange(type, e.target.value)} className={selectClass} disabled={!country}>
                <option value="">Select City</option>
                {availableCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Code</label>
              <input type="text" value={airportCode} readOnly placeholder="Code" className={`${inputClass} bg-stone-50 cursor-not-allowed text-stone-500`} maxLength={3} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Date</label>
              <input type="date" value={date} onChange={e => updateField(`${prefix}Date`, e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Time</label>
              <input type="time" value={time} onChange={e => updateField(`${prefix}Time`, e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
      <h4 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
        <MapPin className="text-[#003828]" size={24} />
        {title}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {renderLocationBlock('from', 'From')}
        {renderLocationBlock('to', 'To')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         <div>
           <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Transport Mode</label>
           <select value={state[`${flightType}TransportMode`] || 'Flight'} onChange={e => updateField(`${flightType}TransportMode`, e.target.value)} className={selectClass}>
             <option value="Flight">Flight</option>
             <option value="Bus">Bus</option>
             <option value="Train">Train</option>
             <option value="Car">Car</option>
             <option value="Van">Van</option>
           </select>
         </div>
         <div>
           <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Transport Number</label>
           <input type="text" value={state[flightPrefix] || ''} onChange={e => updateField(flightPrefix, e.target.value)} placeholder="Enter Registration Number" className={inputClass} />
         </div>
      </div>

      {/* Connecting Flights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-bold text-stone-800 uppercase tracking-wider">CONNECTION</h5>
          <button type="button" onClick={addConnectingFlight} className="flex items-center gap-1.5 text-xs font-bold text-[#003828] bg-[#003828]/10 px-3 py-1.5 rounded-full hover:bg-[#003828]/20 transition-colors">
            <Plus size={14} /> Add Transit/Layover
          </button>
        </div>
        
        {state[connectingPrefix]?.map((conn, idx) => {
          const fromCities = getCities(conn.fromCountry);
          const toCities = getCities(conn.toCountry);

          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200 relative mt-4">
              <button type="button" onClick={() => removeConnectingFlight(idx)} className="absolute top-4 right-4 text-stone-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 border border-stone-200 hover:border-red-500">
                <X size={14} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {/* Connection FROM */}
                <div className="space-y-3">
                  <h6 className="text-xs font-bold text-stone-600 uppercase flex items-center gap-1.5">{getIcon(conn.transportMode || 'Flight', 'from', 14)} From</h6>
                  <select value={conn.fromCountry} onChange={e => { updateConnectingFlight(idx, 'fromCountry', e.target.value); updateConnectingFlight(idx, 'fromCity', ''); updateConnectingFlight(idx, 'fromAirportCode', ''); }} className={selectClass}>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <select value={conn.fromCity} onChange={e => updateConnectingFlight(idx, 'fromCity', e.target.value)} className={selectClass} disabled={!conn.fromCountry}>
                        <option value="">Select City</option>
                        {fromCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input type="text" value={conn.fromAirportCode} readOnly placeholder="Code" className={`${inputClass} bg-stone-50 cursor-not-allowed text-stone-500`} maxLength={3} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={conn.fromDate} onChange={e => updateConnectingFlight(idx, 'fromDate', e.target.value)} className={inputClass} />
                    <input type="time" value={conn.fromTime} onChange={e => updateConnectingFlight(idx, 'fromTime', e.target.value)} className={inputClass} />
                  </div>
                </div>

                {/* Connection TO */}
                <div className="space-y-3">
                  <h6 className="text-xs font-bold text-stone-600 uppercase flex items-center gap-1.5">{getIcon(conn.transportMode || 'Flight', 'to', 14)} To</h6>
                  <select value={conn.toCountry} onChange={e => { updateConnectingFlight(idx, 'toCountry', e.target.value); updateConnectingFlight(idx, 'toCity', ''); updateConnectingFlight(idx, 'toAirportCode', ''); }} className={selectClass}>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <select value={conn.toCity} onChange={e => updateConnectingFlight(idx, 'toCity', e.target.value)} className={selectClass} disabled={!conn.toCountry}>
                        <option value="">Select City</option>
                        {toCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input type="text" value={conn.toAirportCode} readOnly placeholder="Code" className={`${inputClass} bg-stone-50 cursor-not-allowed text-stone-500`} maxLength={3} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={conn.toDate} onChange={e => updateConnectingFlight(idx, 'toDate', e.target.value)} className={inputClass} />
                    <input type="time" value={conn.toTime} onChange={e => updateConnectingFlight(idx, 'toTime', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-stone-100">
                <div>
                   <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Transport Mode</label>
                   <select value={conn.transportMode || 'Flight'} onChange={e => updateConnectingFlight(idx, 'transportMode', e.target.value)} className={selectClass}>
                     <option value="Flight">Flight</option>
                     <option value="Bus">Bus</option>
                     <option value="Train">Train</option>
                     <option value="Car">Car</option>
             <option value="Van">Van</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Transport Number</label>
                   <input type="text" value={conn.flight} onChange={e => updateConnectingFlight(idx, 'flight', e.target.value)} placeholder="Enter Registration Number" className={inputClass} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
