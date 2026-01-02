import React, { useState, useRef, useEffect } from 'react';
import { Settings2, ArrowUp, Loader2, ImagePlus, X, Paperclip } from 'lucide-react';
import { AppMode } from '../types';

interface PromptInputProps {
  isVisible: boolean;
  onGenerate: (prompt: string, images: string[]) => void;
  isGenerating: boolean;
  onOpenSettings: () => void;
  mode?: AppMode;
}

const PromptInput: React.FC<PromptInputProps> = ({ isVisible, onGenerate, isGenerating, onOpenSettings, mode = AppMode.GENERATE }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // Auto-focus when becomes visible
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isVisible]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && selectedImages.length === 0) || isGenerating) return;
    
    onGenerate(prompt, selectedImages);
    
    // In Chat mode, clear input. In Gen mode, keep it.
    if (mode === AppMode.CHAT) {
        setPrompt('');
        setSelectedImages([]);
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [];
      const files = Array.from(e.target.files);
      
      const remainingSlots = 4 - selectedImages.length;
      const filesToProcess = files.slice(0, remainingSlots);

      let processedCount = 0;
      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            newImages.push(reader.result);
          }
          processedCount++;
          if (processedCount === filesToProcess.length) {
            setSelectedImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file as Blob);
      });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div 
        className={`fixed z-50 transition-all duration-300 ease-in-out right-4 bottom-4 left-4 ${
          isVisible 
            ? 'opacity-100 translate-y-0 pointer-events-auto visible' 
            : 'opacity-0 translate-y-8 pointer-events-none invisible'
        }`}
    >
      <form onSubmit={handleSubmit} className={`relative w-full flex bg-surface/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all ring-2 ring-white/10 focus-within:ring-white/30`}>
        
        {/* Left Column: Input and Previews */}
        <div className="flex-1 flex flex-col justify-center py-2 pl-4 pr-1">
            {/* Image Preview Area */}
            {selectedImages.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto py-2 no-scrollbar">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/20 group">
                    <img src={img} alt={`Reference ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={1}
              placeholder={selectedImages.length > 0 ? "画像について..." : (mode === AppMode.CHAT ? "Geminiにメッセージを送信..." : "想像したイメージ...")}
              className="w-full bg-transparent text-white placeholder-white/30 outline-none text-base resize-none overflow-y-auto max-h-[200px] leading-relaxed no-scrollbar"
            />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-1 p-1.5 justify-end flex-shrink-0 bg-white/5 border-l border-white/5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/png, image/jpeg, image/webp"
              multiple
              className="hidden"
            />

            {/* CHAT MODE LAYOUT */}
            {mode === AppMode.CHAT ? (
                <>
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isGenerating || selectedImages.length >= 4}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                            selectedImages.length >= 4 ? 'text-white/20' : 'text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                        title="添付"
                    >
                        <Paperclip size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                        title="設定"
                    >
                        <Settings2 size={20} />
                    </button>
                </>
            ) : (
            /* GENERATE MODE LAYOUT */
                <>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isGenerating || selectedImages.length >= 4}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                            selectedImages.length >= 4 ? 'text-white/20' : 'text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <ImagePlus size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                        <Settings2 size={20} />
                    </button>
                </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={(!prompt.trim() && selectedImages.length === 0) || isGenerating}
              className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center ${
                (prompt.trim() || selectedImages.length > 0) && !isGenerating
                  ? 'bg-white text-black hover:scale-105'
                  : 'bg-white/5 text-white/20'
              }`}
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
            </button>
        </div>

      </form>
    </div>
  );
};

export default PromptInput;
