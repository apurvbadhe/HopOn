
import React, { useState, useEffect, useRef } from 'react';
import { PlaceSuggestion, getPlaceSuggestions } from '../services/geminiService';
import { Coordinates } from '../types';

interface LocationInputProps {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  userCoords?: Coordinates;
  onSelectSuggestion?: (s: PlaceSuggestion) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ 
  label, icon, placeholder, value, onChange, userCoords, onSelectSuggestion 
}) => {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await getPlaceSuggestions(value, userCoords);
      setSuggestions(results);
      setLoading(false);
      
      // Only show suggestions if the input is actively focused by the user
      // This prevents the dropdown from appearing when setting location via GPS
      if (results.length > 0 && document.activeElement === inputRef.current) {
        setShowSuggestions(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input 
          ref={inputRef}
          type="text" 
          required
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 rounded-2xl text-slate-900 placeholder:text-slate-400 transition-all shadow-inner"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-[240px] overflow-y-auto custom-scrollbar">
            {suggestions.map((s, i) => (
              <li 
                key={i}
                onClick={() => {
                  onChange(s.name);
                  setShowSuggestions(false);
                  if (onSelectSuggestion) onSelectSuggestion(s);
                }}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-start gap-3 transition-colors border-b border-slate-50 last:border-0"
              >
                <span className="text-xl mt-0.5">📍</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{s.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">{s.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LocationInput;
