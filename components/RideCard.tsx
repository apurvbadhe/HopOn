
import React from 'react';
import { UserMatch, TransportMode, RideRole } from '../types';

interface RideCardProps {
  match: UserMatch;
  onAction: (match: UserMatch) => void;
  actionLabel: string;
  role: RideRole;
  isBestMatch?: boolean;
}

const RideCard: React.FC<RideCardProps> = ({ match, onAction, actionLabel, role, isBestMatch }) => {
  const isPublisherView = role === RideRole.PUBLISHER;

  const getModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case TransportMode.PERSONAL: return '🚗';
      case TransportMode.CAB: return '🚕';
      case TransportMode.AUTO: return '🛺';
      default: return '📍';
    }
  };

  return (
    <div className={`relative bg-white rounded-2xl p-5 shadow-sm border transition-all flex flex-col sm:flex-row items-center gap-4 ${isBestMatch ? 'border-indigo-400 ring-2 ring-indigo-50 shadow-lg' : 'border-gray-100 hover:shadow-md'}`}>
      {isBestMatch && (
        <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md z-10">
          ✨ Best Match
        </div>
      )}
      
      <img src={match.avatar} alt={match.name} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100" />
      
      <div className="flex-grow text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h3 className="text-lg font-bold text-gray-900">{match.name}</h3>
            {isPublisherView && match.routeFitScore !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                  🛣️ {match.routeFit || 'On Path'}
                </span>
                <span className="text-[10px] font-bold text-indigo-400">{match.routeFitScore}% Match</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 justify-center sm:justify-start">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-medium text-gray-600">{match.rating}</span>
          </div>
        </div>
        
        {isPublisherView ? (
          <div className="space-y-2">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup Passenger At</p>
               <p className="text-sm text-indigo-600 font-black flex items-center gap-2">
                 <span>📍</span> {match.pickupLocation}
               </p>
            </div>
            {match.dropOffLocation && (
              <div className="opacity-70">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Drop-off At</p>
                 <p className="text-xs text-slate-700 font-bold flex items-center gap-2">
                   <span>🏁</span> {match.dropOffLocation}
                 </p>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-50 mt-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                <span>{getModeIcon(match.mode)}</span>
                <span>{match.mode}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                <span>🕒</span>
                <span>ETA: {match.eta}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">
              {getModeIcon(match.mode)} <span className="font-semibold text-gray-700">{match.mode}</span> • {match.vehicleDetails || 'Standard ride'} 
              {match.plateNumber && (
                <span className="ml-1 text-indigo-600 font-mono font-bold">({match.plateNumber})</span>
              )}
            </p>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Pickup: {match.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>ETA: {match.eta}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center sm:items-end gap-3 min-w-[120px]">
        {match.priceEstimate && (
          <span className="text-lg font-bold text-indigo-600">{match.priceEstimate}</span>
        )}
        <button 
          onClick={() => onAction(match)}
          className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default RideCard;
