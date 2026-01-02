import React from 'react';
import { AspectRatio, GenSettings, ImageSize, ModelType } from '../types';
import { X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenSettings;
  setSettings: (s: GenSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  if (!isOpen) return null;

  const aspectRatios: AspectRatio[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const sizes: ImageSize[] = ['1K', '2K', '4K'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-6 animate-slide-up shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">生成設定</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-white/70" />
          </button>
        </div>

        {/* Model Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/60 uppercase tracking-wider">モデル</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setSettings({ ...settings, model: ModelType.PRO })}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                settings.model === ModelType.PRO ? 'border-primary bg-primary/10' : 'border-white/10 hover:bg-white/5'
              } transition-all`}
            >
              <div className="text-left">
                <div className="font-semibold">Banana Pro</div>
                <div className="text-xs text-white/50">Gemini 3 Preview (最高画質)</div>
              </div>
              {settings.model === ModelType.PRO && <Check size={16} className="text-primary" />}
            </button>
            <button
              onClick={() => setSettings({ ...settings, model: ModelType.FLASH })}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                settings.model === ModelType.FLASH ? 'border-accent bg-accent/10' : 'border-white/10 hover:bg-white/5'
              } transition-all`}
            >
              <div className="text-left">
                <div className="font-semibold">Banana Flash</div>
                <div className="text-xs text-white/50">Gemini 2.5 (高速・バックアップ)</div>
              </div>
              {settings.model === ModelType.FLASH && <Check size={16} className="text-accent" />}
            </button>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/60 uppercase tracking-wider">アスペクト比</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setSettings({ ...settings, aspectRatio: ratio })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  settings.aspectRatio === ratio
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Image Size (Only for Pro) */}
        <div className={`space-y-3 transition-opacity ${settings.model !== ModelType.PRO ? 'opacity-50 pointer-events-none' : ''}`}>
           <label className="text-sm font-medium text-white/60 uppercase tracking-wider">解像度</label>
           <div className="flex gap-2">
             {sizes.map((size) => (
               <button
                 key={size}
                 onClick={() => setSettings({ ...settings, imageSize: size })}
                 className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                   settings.imageSize === size
                     ? 'bg-white text-black'
                     : 'bg-white/5 text-white/70 hover:bg-white/10'
                 }`}
               >
                 {size}
               </button>
             ))}
           </div>
        </div>
        
        {/* Count */}
        <div className="space-y-3">
           <label className="text-sm font-medium text-white/60 uppercase tracking-wider">生成枚数: {settings.numberOfImages}</label>
           <input 
             type="range" 
             min="1" 
             max="4" 
             value={settings.numberOfImages} 
             onChange={(e) => setSettings({...settings, numberOfImages: parseInt(e.target.value)})}
             className="w-full accent-white h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
           />
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;