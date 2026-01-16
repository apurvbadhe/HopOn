
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import RideCard from './components/RideCard';
import ProfileView from './components/ProfileView';
import RatingPrompt from './components/RatingPrompt';
import MapView from './components/MapView';
import LocationInput from './components/LocationInput';
import { TransportMode, RideRole, RideRequest, UserMatch, UserProfile, UserRating, RideHistoryEntry, RouteInfo, Coordinates } from './types';
import { getMatches, reverseGeocode, getRouteDetails, geocodeAddress } from './services/geminiService';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'results' | 'status' | 'profile'>('form');
  const [rideRequest, setRideRequest] = useState<RideRequest>({ from: '', to: '', role: RideRole.SEEKER });
  const [userCoords, setUserCoords] = useState<Coordinates | undefined>();
  const [matches, setMatches] = useState<UserMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeRide, setActiveRide] = useState<UserMatch | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [groundedMapsUri, setGroundedMapsUri] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [sortBy, setSortBy] = useState<'fit' | 'rating' | 'eta'>('fit');
  const [modeFilter, setModeFilter] = useState<TransportMode | 'All'>('All');
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authBio, setAuthBio] = useState('');
  const [isRider, setIsRider] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const session = authService.getCurrentSession();
    if (session) {
      setCurrentUser(session);
      setIsAuthenticated(true);
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null
      );
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      let user;
      if (authMode === 'login') {
        user = authService.login(authEmail);
      } else {
        user = authService.register(authName, authEmail, authBio, isRider, vehicleDetails, plateNumber);
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setStep('form');
  };

  const filteredAndSortedMatches = useMemo(() => {
    let list = [...matches];
    if (modeFilter !== 'All') list = list.filter(m => m.mode === modeFilter);
    if (sortBy === 'fit') list.sort((a, b) => (b.routeFitScore || 0) - (a.routeFitScore || 0));
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'eta') list.sort((a, b) => a.eta.localeCompare(b.eta));
    return list;
  }, [matches, sortBy, modeFilter]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lng: longitude });
      const address = await reverseGeocode(latitude, longitude);
      setRideRequest(prev => ({ ...prev, from: address }));
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: true });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!rideRequest.from || !rideRequest.to) return;

    if (rideRequest.role === RideRole.PUBLISHER && !currentUser?.isRider) {
      setFormError("Only registered Riders can publish trips. Please enable Rider mode in your profile to share your vehicle.");
      return;
    }

    setLoading(true);
    setStep('results');
    setModeFilter('All');
    let destCoords: Coordinates | null = null;
    if (rideRequest.role === RideRole.PUBLISHER) destCoords = await geocodeAddress(rideRequest.to);
    const results = await getMatches(rideRequest.from, rideRequest.to, rideRequest.role, destCoords);
    setMatches(results);
    setLoading(false);
  };

  const handleSelectRide = async (match: UserMatch) => {
    setActiveRide(match);
    setStep('status');
    setIsAccepted(false);
    setIsCompleted(false);
    setShowRating(false);
    getRouteDetails(rideRequest.from, rideRequest.to).then((details) => {
      if (details) {
        setRouteInfo(details);
        setGroundedMapsUri(`https://www.google.com/maps/dir/${encodeURIComponent(rideRequest.from)}/${encodeURIComponent(rideRequest.to)}`);
      }
    });
    setTimeout(() => {
      setIsAccepted(true);
      setTimeout(() => { setIsCompleted(true); setShowRating(true); }, 12000); 
    }, 3000);
  };

  const handleRate = (stars: number) => {
    if (!activeRide || !currentUser) return;
    const newRating: UserRating = { stars, timestamp: Date.now() };
    const historyEntry: RideHistoryEntry = {
      id: `ride-${Date.now()}`,
      from: rideRequest.from,
      to: rideRequest.to,
      date: Date.now(),
      partnerName: activeRide.name,
      mode: activeRide.mode,
      role: rideRequest.role
    };
    const updatedUser = {
      ...currentUser,
      ratings: [newRating, ...currentUser.ratings],
      rideHistory: [...currentUser.rideHistory, historyEntry]
    };
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
    setShowRating(false);
    setRouteInfo(null);
    setGroundedMapsUri(null);
    setTimeout(() => { setStep('form'); setActiveRide(null); setIsAccepted(false); setIsCompleted(false); }, 800);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-6 animate-in zoom-in-95 duration-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto shadow-lg shadow-indigo-500/30 mb-4">H</div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">HopOn</h1>
            <p className="text-slate-500 text-sm">{authMode === 'login' ? 'Welcome back!' : 'Join the community'}</p>
          </div>

          {authError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <input 
                type="text" required placeholder="Full Name" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                value={authName} onChange={(e) => setAuthName(e.target.value)}
              />
            )}
            <input 
              type="email" required placeholder="Email Address (e.g. user@domain.com)" 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
              value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
            />
            {authMode === 'register' && (
              <>
                <textarea 
                  placeholder="Tell us about yourself (Bio)..." 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px] placeholder:text-slate-400"
                  value={authBio} onChange={(e) => setAuthBio(e.target.value)}
                />
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500" 
                      checked={isRider} 
                      onChange={(e) => setIsRider(e.target.checked)} 
                    />
                    <span className="text-slate-700 font-semibold group-hover:text-indigo-600 transition-colors">I want to be a Rider (Driver)</span>
                  </label>
                  {isRider && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" required placeholder="Vehicle Name (e.g. Silver Honda City)" 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)}
                      />
                      <input 
                        type="text" required placeholder="License Plate Number" 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl transition-all active:scale-95">
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="text-center">
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(null); }} className="text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors">
              {authMode === 'login' ? "New here? Sign up" : "Have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {currentUser && <Header profile={currentUser} onProfileClick={() => setStep('profile')} />}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        {step === 'profile' && currentUser && (
          <ProfileView profile={currentUser} onUpdate={(u) => { setCurrentUser(u); authService.saveUser(u); }} onClose={() => setStep('form')} onLogout={handleLogout} />
        )}

        {step === 'form' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Ride Sharing, <span className="gradient-text">Redefined.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">Hey {currentUser?.name.split(' ')[0]}, ready for your next commute?</p>
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <form onSubmit={handleSearch} className="space-y-6">
                {formError && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                    <span className="text-xl">💡</span>
                    <div>
                      <p className="text-sm font-bold text-indigo-900 mb-1">Rider Verification Required</p>
                      <p className="text-xs text-indigo-700 mb-3">{formError}</p>
                      <button 
                        type="button" 
                        onClick={() => setStep('profile')} 
                        className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline"
                      >
                        Update Profile to Rider →
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <div className="flex justify-end items-center mb-1">
                      <button type="button" onClick={handleDetectLocation} disabled={locating} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 hover:text-indigo-600 transition-all px-1">
                        {locating ? '📡 Locating...' : '📍 Current Location'}
                      </button>
                    </div>
                    <LocationInput label="From Location" icon="📍" placeholder="Where are you now?" value={rideRequest.from} userCoords={userCoords} onChange={(v) => setRideRequest({ ...rideRequest, from: v })} />
                  </div>
                  <div className="relative pt-[21px]">
                    <LocationInput label="To Destination" icon="🏁" placeholder="Where to?" value={rideRequest.to} userCoords={userCoords} onChange={(v) => setRideRequest({ ...rideRequest, to: v })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => { setRideRequest({ ...rideRequest, role: RideRole.SEEKER }); setFormError(null); }} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${rideRequest.role === RideRole.SEEKER ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                    <span className="text-3xl">🔍</span>
                    <div className="text-center">
                      <p className="font-bold text-slate-900">Look for Ride</p>
                      <p className="text-xs text-slate-500">Find a seat</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => { setRideRequest({ ...rideRequest, role: RideRole.PUBLISHER }); setFormError(null); }} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${rideRequest.role === RideRole.PUBLISHER ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'} ${!currentUser?.isRider ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                    <span className="text-3xl">📢</span>
                    <div className="text-center">
                      <p className="font-bold text-slate-900">Publish Ride</p>
                      <p className="text-xs text-slate-500">{!currentUser?.isRider ? 'Riders Only' : "I'm driving"}</p>
                    </div>
                  </button>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                  Search Live Rides
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep('form')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors">← Edit Search</button>
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Route set to</p>
                <p className="text-sm text-slate-900 font-semibold">{rideRequest.to}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              {rideRequest.role === RideRole.SEEKER ? 'Available Riders' : 'Interested Passengers'}
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse text-center">Finding users matching your path...</p>
              </div>
            ) : filteredAndSortedMatches.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredAndSortedMatches.map((match, idx) => (
                  <RideCard key={match.id} match={match} role={rideRequest.role} isBestMatch={idx === 0 && sortBy === 'fit'} actionLabel={rideRequest.role === RideRole.SEEKER ? 'Request Join' : 'Offer Seat'} onAction={handleSelectRide} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No users found nearby</h3>
                <p className="text-slate-500 mb-6">It looks like there are no real accounts searching or publishing on this route yet. Spread the word!</p>
                <button onClick={() => setStep('form')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">Try another route</button>
              </div>
            )}
          </div>
        )}

        {step === 'status' && activeRide && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-500">
            {!showRating ? (
              <>
                <div className="text-center space-y-3">
                  <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl transition-all duration-1000 ${isAccepted ? (isCompleted ? 'bg-green-100 scale-110' : 'bg-indigo-100 scale-110') : 'bg-slate-100 animate-bounce'}`}>
                    {isCompleted ? '🚩' : (isAccepted ? '🚕' : '📨')}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-slate-900">{isCompleted ? 'Destination Reached' : (isAccepted ? 'On Our Way' : 'Pending Request')}</h2>
                    {isAccepted && !isCompleted && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live Trip</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl space-y-0 relative">
                  {routeInfo ? (
                    <>
                      <MapView route={routeInfo} isCompleted={isCompleted} />
                      {groundedMapsUri && <a href={groundedMapsUri} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-100 shadow-lg text-xs font-bold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"><span>🗺️</span> Google Maps</a>}
                    </>
                  ) : (
                    <div className="w-full h-[320px] bg-slate-50 flex flex-col items-center justify-center gap-2">
                       <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Generating Map...</p>
                    </div>
                  )}
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <img src={activeRide.avatar} alt={activeRide.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-50 shadow-sm" />
                        <div><h3 className="text-xl font-bold text-slate-900">{activeRide.name}</h3><div className="flex items-center gap-1"><span className="text-yellow-400">★</span><span className="text-sm text-slate-500 font-medium">{activeRide.rating} Partner</span></div></div>
                      </div>
                      <div className="text-right"><p className="text-xs text-slate-400 font-bold uppercase">{isCompleted ? 'Arrival' : 'ETA'}</p><p className="text-2xl font-black text-indigo-600">{isCompleted ? 'Done' : activeRide.eta}</p></div>
                    </div>
                    <div className="space-y-6 pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1 mt-1"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div><div className="w-0.5 h-12 bg-slate-100"></div><div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm"></div></div>
                        <div className="flex-grow space-y-8">
                          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pickup Point</p><p className="text-slate-800 font-bold">{activeRide.pickupLocation || rideRequest.from}</p></div>
                          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Drop-off Destination</p><p className="text-slate-800 font-bold">{activeRide.dropOffLocation || rideRequest.to}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {!isCompleted && <button onClick={() => { setStep('form'); setActiveRide(null); setIsAccepted(false); setRouteInfo(null); setGroundedMapsUri(null); }} className="w-full py-4 text-slate-400 font-bold hover:text-rose-500 transition-colors flex items-center justify-center gap-2"><span>✕</span> Cancel Ride</button>}
              </>
            ) : (
              <RatingPrompt target={activeRide} onRate={handleRate} />
            )}
          </div>
        )}
      </main>
      <footer className="py-8 border-t border-slate-200 mt-auto bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">© 2025 HopOn Mobility. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
