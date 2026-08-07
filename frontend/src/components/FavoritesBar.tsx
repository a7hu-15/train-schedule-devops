import React from 'react';
import { Star, Train, X } from 'lucide-react';

interface FavoritesBarProps {
  favorites: string[];
  onSelectFavorite: (trainNumber: string) => void;
  onRemoveFavorite: (trainNumber: string) => void;
  onClose: () => void;
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
  onClose,
}) => {
  if (favorites.length === 0) {
    return (
      <div className="w-full glass-panel rounded-2xl p-4 mb-6 text-center text-slate-400 text-xs border border-slate-800">
        No favorite trains bookmarked yet. Click the star icon on any train status header to save it!
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-2xl p-4 mb-6 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
          <Star className="w-4 h-4 fill-amber-400" />
          <span>Saved Favorite Trains</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {favorites.map((trainNum) => (
          <div
            key={trainNum}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 transition group"
          >
            <button
              onClick={() => onSelectFavorite(trainNum)}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 group-hover:text-amber-300"
            >
              <Train className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{trainNum}</span>
            </button>
            <button
              onClick={() => onRemoveFavorite(trainNum)}
              className="text-slate-600 hover:text-rose-400 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
