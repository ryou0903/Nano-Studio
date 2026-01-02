import React, { useState, useEffect } from 'react';
import { X, Trash2, KeyRound, Database, Info, Eye, EyeOff, Save } from 'lucide-react';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearImages: () => Promise<void>;
  onClearChats: () => Promise<void>;
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onClearImages,
  onClearChats,
  currentApiKey,
  onSaveApiKey
}) => {
  const [keyInput, setKeyInput] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
      setKeyInput(currentApiKey);
  }, [currentApiKey, isOpen]);

  if (!isOpen) return null;

  const handleClearImages = async () => {
      if (confirm("すべての生成画像を削除しますか？この操作は取り消せません。")) {
          await onClearImages();
          alert("すべての画像を削除しました。");
      }
  };

  const handleClearChats = async () => {
      if (confirm("すべてのチャット履歴を削除しますか？この操作は取り消せません。")) {
          await onClearChats();
          alert("すべてのチャット履歴を削除しました。");
      }
  };

  const handleSaveKey = () => {
      onSaveApiKey(keyInput);
      alert("APIキーを保存しました。");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-6 animate-slide-up shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database size={20} className="text-white/70" />
              アプリ設定
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-white/70" />
          </button>
        </div>

        {/* Account / API Key */}
        <div className="space-y-4">
             <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">APIキー設定</h3>
             <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <KeyRound size={16} className="text-primary" />
                    <span className="text-sm font-medium text-white">Google Gemini API Key</span>
                </div>
                <div className="relative">
                    <input 
                        type={showKey ? "text" : "password"}
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-3 pr-10 text-sm text-white outline-none focus:border-primary/50"
                    />
                    <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <div className="flex justify-end">
                    <button 
                        onClick={handleSaveKey}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                        <Save size={14} /> 保存
                    </button>
                </div>
                <p className="text-[10px] text-white/30 leading-relaxed">
                    キーはブラウザにのみ保存され、外部に送信されることはありません。
                    <br />
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Google AI Studioでキーを取得
                    </a>
                </p>
             </div>
        </div>

        {/* Data Management */}
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">データ管理</h3>
            
            <button 
                onClick={handleClearImages}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/10 group-hover:bg-red-500/20 text-white group-hover:text-red-400">
                        <Trash2 size={18} />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-white group-hover:text-red-400">画像ギャラリーを削除</div>
                        <div className="text-xs text-white/40">保存されたすべての画像を消去します</div>
                    </div>
                </div>
            </button>

            <button 
                onClick={handleClearChats}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/10 group-hover:bg-red-500/20 text-white group-hover:text-red-400">
                        <Trash2 size={18} />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-white group-hover:text-red-400">チャット履歴を削除</div>
                        <div className="text-xs text-white/40">保存されたすべての会話を消去します</div>
                    </div>
                </div>
            </button>
        </div>

        <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-white/30 flex items-center justify-center gap-1">
                <Info size={12} /> Nano Studio v1.2.0
            </p>
        </div>

      </div>
    </div>
  );
};

export default GlobalSettingsModal;