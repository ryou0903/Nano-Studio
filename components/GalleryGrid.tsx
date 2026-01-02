import React from 'react';
import { GeneratedImage, PendingImage } from '../types';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface GalleryGridProps {
  images: GeneratedImage[];
  pendingImages?: PendingImage[];
  columns: number;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onImageClick: (image: GeneratedImage) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({
  images,
  pendingImages = [],
  columns,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onImageClick
}) => {
  // Simple CSS grid configuration based on props
  const getGridClass = () => {
    switch (columns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      case 5: return 'grid-cols-5';
      default: return 'grid-cols-3';
    }
  };

  return (
    <div className={`grid ${getGridClass()} gap-1 p-1 pb-32`}>
      {/* Pending Images (Reservation Slots) */}
      {pendingImages.map((pImg) => (
        <div 
          key={pImg.id} 
          className="relative aspect-square overflow-hidden bg-surface/50 border border-white/5 rounded-md flex flex-col items-center justify-center p-4 animate-pulse"
        >
          {/* Status Badge */}
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] text-white/70 font-medium">
            In queue
          </div>

          <div className="w-full max-w-[80%] space-y-2 text-center z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
               <Loader2 size={16} className="animate-spin text-primary" />
               <span className="text-lg font-bold text-white tabular-nums">{Math.round(pImg.progress)}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-300 ease-out"
                 style={{ width: `${pImg.progress}%` }}
               />
            </div>
          </div>
        </div>
      ))}

      {/* Generated Images */}
      {images.map((img) => {
        const isSelected = selectedIds.has(img.id);
        
        return (
          <div
            key={img.id}
            className="relative group aspect-square overflow-hidden bg-surface rounded-md cursor-pointer touch-manipulation"
            onClick={() => {
              if (selectionMode) {
                onToggleSelect(img.id);
              } else {
                onImageClick(img);
              }
            }}
            onContextMenu={(e) => {
               e.preventDefault();
               if (!selectionMode) onToggleSelect(img.id); // Long press logic simulation usually done via touch events, but context menu is a fallback
            }}
          >
            <img
              src={img.base64}
              alt={img.prompt}
              className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-90' : 'group-hover:scale-105'}`}
              loading="lazy"
            />
            
            {/* Selection Overlay */}
            {(selectionMode || isSelected) && (
              <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-black/40' : 'bg-transparent'}`}>
                <div className={`absolute top-2 right-2 transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`}>
                   <div className="bg-primary rounded-full p-1 shadow-md">
                      <CheckCircle2 size={16} className="text-white fill-primary" />
                   </div>
                </div>
                {!isSelected && selectionMode && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white/50 bg-black/20" />
                )}
              </div>
            )}
            
            {/* Gradient Overlay for Text (only non-selection mode) */}
            {!selectionMode && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-xs text-white/90 line-clamp-1 truncate">{img.prompt}</p>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GalleryGrid;