import React from 'react';
import { X, Trash2, KeyRound, Database, Info, AlertTriangle } from 'lucide-react';
import * as db from '../services/db';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetApiKey: () => void;
  onClearImages: () => Promise<void>;
  onClearChats: () => Promise<void>;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onResetApiKey,
  onClearImages,
  onClearChats
}) => {
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

        {/* Account / System */}
        <div className="space-y-4">
             <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">システム</h3>

             <button 
                onClick={() => { onClose(); onResetApiKey(); }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/10 text-primary">
                        <KeyRound size={18} />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-white">APIキーの再選択</div>
                        <div className="text-xs text-white/40">別のアカウントに切り替える場合など</div>
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