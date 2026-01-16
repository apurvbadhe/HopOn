
import React, { useState } from 'react';
import { UserMatch } from '../types';

interface RatingPromptProps {
  target: UserMatch;
  onRate: (stars: number) => void;
}

const RatingPrompt: React.FC<RatingPromptProps> = ({ target, onRate }) => {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <div className="bg-indigo-600 text-white rounded-3xl p-8 text-center space-y-6 shadow-xl shadow-indigo-100 animate-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">How was your trip with {target.name}?</h3>
        <p className="text-indigo-100 text-sm opacity-80">Your rating helps keep the HopOn community safe and friendly.</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            className="text-4xl transition-all active:scale-90"
          >
            <span className={`transition-colors ${(hovered || selected) >= star ? 'text-yellow-300 drop-shadow-sm' : 'text-indigo-400 opacity-30'}`}>
              ★
            </span>
          </button>
        ))}
      </div>

      <button
        disabled={selected === 0}
        onClick={() => onRate(selected)}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${selected > 0 ? 'bg-white text-indigo-600 shadow-lg hover:bg-indigo-50 active:scale-95' : 'bg-indigo-500 text-indigo-300 cursor-not-allowed opacity-50'}`}
      >
        Submit Rating
      </button>
    </div>
  );
};

export default RatingPrompt;
