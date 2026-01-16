
import React, { useState } from 'react';
import { UserProfile, TransportMode, RideRole } from '../types';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onClose: () => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdate, onClose, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedBio, setEditedBio] = useState(profile.bio);
  const [editedAvatar, setEditedAvatar] = useState(profile.avatar);
  const [activeTab, setActiveTab] = useState<'ratings' | 'history'>('history');

  const hasCompletedRide = profile.rideHistory && profile.rideHistory.length > 0;

  const avgRating = profile.ratings.length > 0 
    ? (profile.ratings.reduce((acc, r) => acc + r.stars, 0) / profile.ratings.length).toFixed(1)
    : "N/A";

  const handleSave = () => {
    onUpdate({
      ...profile,
      name: editedName,
      bio: editedBio,
      avatar: editedAvatar
    });
    setIsEditing(false);
  };

  const getModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case TransportMode.PERSONAL: return '🚗';
      case TransportMode.CAB: return '🚕';
      case TransportMode.AUTO: return '🛺';
      default: return '📍';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 max-w-2xl mx-auto animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-start mb-8">
        <button onClick={onClose} className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 transition-colors">
          <span>✕</span> <span>Close</span>
        </button>
        <div className="flex gap-2">
          <button 
            onClick={onLogout}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100"
          >
            Logout
          </button>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditing ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}`}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="relative group">
          <img 
            src={editedAvatar} 
            alt={profile.name} 
            className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 shadow-lg transition-transform group-hover:scale-105"
          />
          {hasCompletedRide && (
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center animate-bounce-slow" title="Verified Member">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {isEditing && (
            <input 
              type="text"
              value={editedAvatar}
              onChange={(e) => setEditedAvatar(e.target.value)}
              placeholder="Avatar URL"
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 text-[10px] bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 shadow-sm text-slate-900"
            />
          )}
        </div>

        <div className="text-center space-y-2 w-full">
          {isEditing ? (
            <input 
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-2xl font-black text-center w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 py-2 text-slate-900"
            />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
                {hasCompletedRide && (
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                    Verified
                  </span>
                )}
              </div>
              {profile.isRider && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                    Verified Rider
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{profile.plateNumber}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1 border border-amber-100">
              ★ {avgRating}
            </span>
            <span className="text-slate-500 text-sm font-semibold">{profile.ratings.length} reviews</span>
          </div>
        </div>

        <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">About Me</p>
          {isEditing ? (
            <textarea 
              value={editedBio}
              onChange={(e) => setEditedBio(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 py-3 px-4 min-h-[100px] text-slate-900 shadow-inner"
              placeholder="Tell us a bit about yourself..."
            />
          ) : (
            <p className="text-slate-800 leading-relaxed italic px-1 font-medium">
              "{profile.bio || "No bio added yet. Tell people why they should hop on with you!"}"
            </p>
          )}
          
          {profile.isRider && !isEditing && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
              <span className="text-2xl">🚗</span>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</p>
                <p className="text-sm font-bold text-slate-700">{profile.vehicleDetails}</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Ride History
            </button>
            <button 
              onClick={() => setActiveTab('ratings')}
              className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'ratings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Recent Ratings
            </button>
          </div>

          {activeTab === 'history' ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {profile.rideHistory.length > 0 ? (
                profile.rideHistory.map((ride) => (
                  <div key={ride.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getModeIcon(ride.mode)}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{ride.to}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(ride.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ride.role === RideRole.SEEKER ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {ride.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="opacity-70 font-semibold">With:</span>
                      <span className="font-bold text-slate-800">{ride.partnerName}</span>
                    </div>
                  </div>
                )).reverse()
              ) : (
                <div className="text-center py-10 px-6">
                  <div className="text-4xl mb-3">🛣️</div>
                  <p className="text-sm text-slate-500 font-medium">Your journey is just beginning. Your past rides will appear here.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {profile.ratings.length > 0 ? (
                profile.ratings.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <span key={idx} className={`text-lg ${idx < r.stars ? "text-amber-400" : "text-slate-200"}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-500">{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 font-medium text-center py-10 italic">No reviews yet. Complete a trip to get rated!</p>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProfileView;
