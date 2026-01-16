
import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  profile: UserProfile;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, onProfileClick }) => {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">HopOn</span>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">How it works</a>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Safety</a>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Savings</a>
        </nav>

        <div 
          onClick={onProfileClick}
          className="flex items-center gap-3 p-1.5 pl-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{profile.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Profile</p>
          </div>
          <img src={profile.avatar} alt={profile.name} className="w-9 h-9 rounded-xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100" />
        </div>
      </div>
    </header>
  );
};

export default Header;
