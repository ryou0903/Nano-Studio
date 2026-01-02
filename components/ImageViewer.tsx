import React from 'react';
import { GeneratedImage } from '../types';
import { X, Trash2, Info, Download } from 'lucide-react';

interface ImageViewerProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (image: GeneratedImage) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ image, onClose, onDelete, onDownload }) => {
  const [showInfo, setShowInfo] = React.useState(false);

  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-fade-in">
      {/* Background Image Blurring */}
      <div 
        className="absolute inset-0 opacity-30 blur-3xl scale-125"
        style={{ backgroundImage: `url(${image.base64})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
      />
      
      {/* Main Image */}
      <img
        src={image.base64}
        alt={image.prompt}
        className="relative max-w-full max-h-full object-contain p-2 sm:p-8 transition-transform"
      />

      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
         <button onClick={onClose} className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/10">
            <X size={24} />
         </button>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
         <button 
            onClick={() => onDownload(image)} 
            className="p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-black transition-all"
         >
            <Download size={24} />
         </button>

         <button onClick={() => setShowInfo(!showInfo)} className={`p-4 rounded-full backdrop-blur-md transition-all ${showInfo ? 'bg-white text-black' : 'bg-black/40 text-white'}`}>
            <Info size={24} />
         </button>
         <button 
            onClick={() => {
                if(confirm('この画像を削除しますか？')) {
                    onDelete(image.id);
                    onClose();
                }
            }} 
            className="p-4 rounded-full bg-red-500/20 text-red-400 backdrop-blur-md hover:bg-red-500 hover:text-white transition-all"
         >
            <Trash2 size={24} />
         </button>
      </div>

      {/* Info Sheet */}
      {showInfo && (
          <div className="absolute bottom-28 left-4 right-4 bg-surface/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 animate-slide-up text-sm">
              <h4 className="text-xs text-white/50 uppercase tracking-wider mb-1">プロンプト</h4>
              <p className="text-white mb-3">{image.prompt}</p>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider mb-1">モデル</h4>
                      <p className="text-white font-mono text-xs">{image.model.split('-').slice(0, 3).join('-')}</p>
                  </div>
                  <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider mb-1">作成日</h4>
                      <p className="text-white text-xs">{new Date(image.timestamp).toLocaleDateString()}</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ImageViewer;