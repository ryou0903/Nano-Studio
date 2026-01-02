import React, { useState, useEffect, useRef } from 'react';
import { ChatSettings, ChatModelType, ThinkingBudget, SystemPrompt, KnowledgeFile } from '../types';
import { X, Check, Save, Plus, Trash2, FileText, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  setSettings: (s: ChatSettings) => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null); // For new/edit mode
  const [isPromptListOpen, setIsPromptListOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load system prompts from local storage
  useEffect(() => {
    const saved = localStorage.getItem('nano_studio_system_prompts');
    if (saved) {
        setSystemPrompts(JSON.parse(saved));
    }
  }, []);

  const saveSystemPrompts = (prompts: SystemPrompt[]) => {
      setSystemPrompts(prompts);
      localStorage.setItem('nano_studio_system_prompts', JSON.stringify(prompts));
  };

  const handleCreatePrompt = () => {
      setEditingPrompt({ id: uuidv4(), name: '新しいプロンプト', content: '' });
  };

  const handleSavePrompt = () => {
      if (!editingPrompt) return;
      const existingIdx = systemPrompts.findIndex(p => p.id === editingPrompt.id);
      let newPrompts;
      if (existingIdx >= 0) {
          newPrompts = [...systemPrompts];
          newPrompts[existingIdx] = editingPrompt;
      } else {
          newPrompts = [...systemPrompts, editingPrompt];
      }
      saveSystemPrompts(newPrompts);
      setSettings({ ...settings, systemPromptId: editingPrompt.id, isSystemPromptEnabled: true });
      setEditingPrompt(null);
  };

  const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newPrompts = systemPrompts.filter(p => p.id !== id);
      saveSystemPrompts(newPrompts);
      if (settings.systemPromptId === id) {
          setSettings({ ...settings, systemPromptId: null });
      }
  };

  // --- File Handling ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const files = Array.from(e.target.files) as File[];
          const newFiles: KnowledgeFile[] = [];

          files.forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                      newFiles.push({
                          id: uuidv4(),
                          name: file.name,
                          mimeType: file.type || 'text/plain',
                          data: reader.result.split(',')[1] // store base64 only (remove prefix)
                      });
                      
                      // Update settings after all processed (simplified for now one by one)
                      setSettings(prev => ({
                          ...prev,
                          knowledgeFiles: [...prev.knowledgeFiles, ...newFiles]
                      }));
                  }
              };
              reader.readAsDataURL(file);
          });
          
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const removeFile = (id: string) => {
      setSettings(prev => ({
          ...prev,
          knowledgeFiles: prev.knowledgeFiles.filter(f => f.id !== id)
      }));
  };

  if (!isOpen) return null;

  const currentSystemPrompt = systemPrompts.find(p => p.id === settings.systemPromptId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-white/10 p-6 space-y-6 animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Gemini 設定</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-white/70" />
          </button>
        </div>

        {/* Model Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/60 uppercase tracking-wider">モデル</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setSettings({ ...settings, model: ChatModelType.GEMINI_3_PRO })}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                settings.model === ChatModelType.GEMINI_3_PRO ? 'border-primary bg-primary/10' : 'border-white/10 hover:bg-white/5'
              } transition-all`}
            >
              <div className="text-left">
                <div className="font-semibold">Gemini 3 Pro</div>
                <div className="text-xs text-white/50">複雑な推論・高品質</div>
              </div>
              {settings.model === ChatModelType.GEMINI_3_PRO && <Check size={16} className="text-primary" />}
            </button>
            <button
              onClick={() => setSettings({ ...settings, model: ChatModelType.GEMINI_3_FLASH })}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                settings.model === ChatModelType.GEMINI_3_FLASH ? 'border-accent bg-accent/10' : 'border-white/10 hover:bg-white/5'
              } transition-all`}
            >
              <div className="text-left">
                <div className="font-semibold">Gemini 3 Flash</div>
                <div className="text-xs text-white/50">高速・低レイテンシ</div>
              </div>
              {settings.model === ChatModelType.GEMINI_3_FLASH && <Check size={16} className="text-accent" />}
            </button>
          </div>
        </div>

        {/* Web Search */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/60 uppercase tracking-wider">Web Search (Grounding)</label>
                <button 
                    onClick={() => setSettings({...settings, useWebSearch: !settings.useWebSearch})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.useWebSearch ? 'bg-primary' : 'bg-white/20'}`}
                >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.useWebSearch ? 'translate-x-6' : ''}`} />
                </button>
            </div>
            <p className="text-xs text-white/40">Google検索を利用して最新情報を取得します。</p>
        </div>

        {/* Knowledge Base */}
        <div className="space-y-3">
             <label className="text-sm font-medium text-white/60 uppercase tracking-wider">ナレッジベース (参照知識)</label>
             <div className="flex flex-col gap-3">
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.txt,.csv,.md,.json"
                    multiple
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 transition-colors border-dashed"
                 >
                    <Upload size={16} />
                    <span className="text-sm">ファイルをアップロード (PDF, TXT)</span>
                 </button>

                 {settings.knowledgeFiles.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                         {settings.knowledgeFiles.map(file => (
                             <div key={file.id} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-sm border border-white/5">
                                 <FileText size={14} className="text-primary" />
                                 <span className="max-w-[150px] truncate">{file.name}</span>
                                 <button onClick={() => removeFile(file.id)} className="text-white/40 hover:text-white">
                                     <X size={14} />
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
                 <p className="text-xs text-white/40">アップロードしたファイルはコンテキストとして使用されます。</p>
             </div>
        </div>

        {/* System Prompt (Toggle & Collapsible) */}
        <div className="space-y-3 border-t border-white/10 pt-4">
             <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/60 uppercase tracking-wider">システムプロンプト</label>
                <button 
                    onClick={() => setSettings({...settings, isSystemPromptEnabled: !settings.isSystemPromptEnabled})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.isSystemPromptEnabled ? 'bg-primary' : 'bg-white/20'}`}
                >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.isSystemPromptEnabled ? 'translate-x-6' : ''}`} />
                </button>
            </div>
            
            {settings.isSystemPromptEnabled && (
                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden animate-fade-in">
                    {/* Selected Prompt Display */}
                    <div className="p-3 flex items-center justify-between" onClick={() => !editingPrompt && setIsPromptListOpen(!isPromptListOpen)}>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">
                                {currentSystemPrompt ? currentSystemPrompt.name : '未選択'}
                            </span>
                            <span className="text-xs text-white/40">
                                {currentSystemPrompt ? '現在適用中' : 'プロンプトを選択してください'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Create New Button (Always visible) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreatePrompt();
                                    setIsPromptListOpen(true);
                                }}
                                className="text-primary text-xs flex items-center gap-1 hover:text-primary/80 bg-primary/10 px-2 py-1 rounded"
                            >
                                <Plus size={14} /> 新規
                            </button>
                             <button className="text-white/40">
                                {isPromptListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                             </button>
                        </div>
                    </div>

                    {/* Expandable List / Editor */}
                    {(isPromptListOpen || editingPrompt) && (
                        <div className="border-t border-white/5 p-3 bg-black/20">
                            {editingPrompt ? (
                                <div className="space-y-3 animate-fade-in">
                                    <input 
                                        type="text" 
                                        value={editingPrompt.name} 
                                        onChange={(e) => setEditingPrompt({...editingPrompt, name: e.target.value})}
                                        placeholder="プロンプト名"
                                        className="w-full bg-transparent border-b border-white/10 p-2 text-white outline-none"
                                    />
                                    <textarea 
                                        value={editingPrompt.content}
                                        onChange={(e) => setEditingPrompt({...editingPrompt, content: e.target.value})}
                                        placeholder="あなたは親切なAIアシスタントです..."
                                        className="w-full bg-black/20 rounded-lg p-3 h-32 text-sm text-white resize-none outline-none focus:ring-1 focus:ring-primary/50"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingPrompt(null)} className="px-3 py-1.5 text-xs text-white/60 hover:text-white">キャンセル</button>
                                        <button onClick={handleSavePrompt} className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg flex items-center gap-1">
                                            <Save size={12} /> 保存
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                    {systemPrompts.length === 0 && (
                                        <p className="text-xs text-center text-white/30 py-2">保存されたプロンプトはありません</p>
                                    )}
                                    {systemPrompts.map(prompt => (
                                        <div key={prompt.id} className="flex gap-2 group">
                                            <button 
                                                onClick={() => {
                                                    setSettings({...settings, systemPromptId: prompt.id});
                                                    setIsPromptListOpen(false);
                                                }}
                                                className={`flex-1 text-left p-2 rounded-lg flex justify-between items-center transition-all ${settings.systemPromptId === prompt.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-white/80'}`}
                                            >
                                                <span className="text-sm truncate">{prompt.name}</span>
                                                {settings.systemPromptId === prompt.id && <Check size={14} />}
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingPrompt(prompt); }}
                                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded"
                                            >
                                                <Settings2Icon size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeletePrompt(prompt.id, e)}
                                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Thinking */}
        <div className="space-y-3">
            <label className="text-sm font-medium text-white/60 uppercase tracking-wider">Thinking (推論)</label>
            <select 
                value={settings.thinkingBudget}
                onChange={(e) => setSettings({...settings, thinkingBudget: parseInt(e.target.value)})}
                className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white outline-none focus:border-white/30"
            >
                <option value={ThinkingBudget.OFF}>OFF (高速)</option>
                <option value={ThinkingBudget.LOW}>Low (2k Tokens)</option>
                <option value={ThinkingBudget.MEDIUM}>Medium (4k Tokens)</option>
                <option value={ThinkingBudget.HIGH}>High (8k Tokens)</option>
                <option value={settings.model === ChatModelType.GEMINI_3_PRO ? ThinkingBudget.MAX_PRO : ThinkingBudget.MAX_FLASH}>
                    Max ({settings.model === ChatModelType.GEMINI_3_PRO ? '32k' : '24k'})
                </option>
            </select>
            <p className="text-xs text-white/40">思考プロセスを追加し、論理的な回答を強化します（応答時間が長くなります）。</p>
        </div>

      </div>
    </div>
  );
};

// Helper icon
const Settings2Icon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default ChatSettingsModal;