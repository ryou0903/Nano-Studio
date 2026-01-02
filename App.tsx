import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppMode, GeneratedImage, GenSettings, ModelType, PendingImage, ChatSession, ChatSettings, ChatModelType, ThinkingBudget, ChatMessage } from './types';
import * as db from './services/db';
import * as gemini from './services/geminiService';
import * as zipService from './services/zipService';
import { v4 as uuidv4 } from 'uuid';

import GalleryGrid from './components/GalleryGrid';
import PromptInput from './components/PromptInput';
import RadialMenu from './components/RadialMenu';
import SettingsModal from './components/SettingsModal';
import ChatSettingsModal from './components/ChatSettingsModal';
import GlobalSettingsModal from './components/GlobalSettingsModal';
import ImageViewer from './components/ImageViewer';
import ChatInterface from './components/ChatInterface';
import ChatHistory from './components/ChatHistory';

import { Loader2, KeyRound, AlertCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATE);
  
  // Image State
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // Chat State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isChatThinking, setIsChatThinking] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); // Shared for Image & Chat
  
  // Error State
  const [errorToast, setErrorToast] = useState<{title: string, message: string} | null>(null);
  
  // Selection State (Image Mode)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Input State
  const [isInputVisible, setIsInputVisible] = useState(false);
  
  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Image Settings
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false); // Chat Settings
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false); // Global Settings

  // Welcome Screen Input
  const [welcomeInputKey, setWelcomeInputKey] = useState('');

  const [genSettings, setGenSettings] = useState<GenSettings>({
    model: ModelType.PRO,
    aspectRatio: '1:1',
    imageSize: '1K',
    numberOfImages: 1,
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings>({
      model: ChatModelType.GEMINI_3_PRO,
      isSystemPromptEnabled: false,
      systemPromptId: null,
      knowledgeFiles: [],
      useWebSearch: false,
      thinkingBudget: ThinkingBudget.OFF,
  });

  // Viewer
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);

  // Grid Config
  const [gridCols, setGridCols] = useState(3);

  // --- Initialization ---
  useEffect(() => {
    initialize();
  }, []);

  // Update input visibility on mode change
  useEffect(() => {
      if (mode === AppMode.CHAT) {
          setIsInputVisible(true);
      } else if (mode === AppMode.GALLERY) {
          setIsInputVisible(false);
      }
  }, [mode]);

  const initialize = async () => {
    await loadApiKey();
    await loadData();
    setLoading(false);
  };

  const loadApiKey = async () => {
    // 1. Try Local Storage
    const storedKey = localStorage.getItem('nano_studio_api_key');
    if (storedKey) {
        setApiKey(storedKey);
        return;
    }

    // 2. Try Process Env (Fallback/Dev)
    if (process.env.API_KEY) {
        setApiKey(process.env.API_KEY);
        return;
    }

    // 3. Try Window global (Legacy/IDX)
    const win = window as any;
    if (win.aistudio) {
        try {
            const has = await win.aistudio.hasSelectedApiKey();
            if (has) {
                // We can't easily extract the string from aistudio object if not exposed,
                // but usually process.env.API_KEY is populated if hasSelectedApiKey is true in IDX.
                // If we are here, it means process.env.API_KEY was empty.
                // We might need to ask user to select key again to populate env?
                // For now, let's assume if process.env.API_KEY is missing, we need manual input.
            }
        } catch (e) {}
    }
  };

  const saveApiKey = (key: string) => {
      localStorage.setItem('nano_studio_api_key', key);
      setApiKey(key);
  };

  const loadData = async () => {
    try {
      const storedImages = await db.getImages();
      setImages(storedImages);
      
      const storedChats = await db.getChats();
      setChatSessions(storedChats);
    } catch (e) {
      console.error("Failed to load data", e);
    }
  };

  const showError = (title: string, message: string) => {
      setErrorToast({ title, message });
      setTimeout(() => setErrorToast(current => 
          (current?.title === title && current?.message === message) ? null : current
      ), 6000);
  };

  // --- Actions ---

  const handleSwitchMode = (newMode: AppMode) => {
    setMode(newMode);
    setSelectionMode(false);
    setSelectedIds(new Set());
    // Input visibility handled by useEffect
  };

  // --- Image Generation Logic ---
  const handleGenerateImage = async (prompt: string, referenceImages: string[]) => {
    setIsGenerating(true);
    
    // Create Pending Slots
    const newPendingIds = Array.from({ length: genSettings.numberOfImages }, () => generateId());
    const newPendingItems: PendingImage[] = newPendingIds.map(id => ({
        id, timestamp: Date.now(), progress: 2
    }));
    setPendingImages(prev => [...newPendingItems, ...prev]);

    // Simulation
    const isPro = genSettings.model === ModelType.PRO;
    const intervalMs = 150;
    const speedFactor = isPro ? 0.02 : 0.05; 

    const progressInterval = setInterval(() => {
        setPendingImages(current => {
            return current.map(item => {
                if (newPendingIds.includes(item.id)) {
                    const target = 99;
                    const remaining = target - item.progress;
                    const jitter = 0.9 + Math.random() * 0.2;
                    const increment = Math.max((remaining * speedFactor * jitter), 0.1);
                    return { ...item, progress: Math.min(item.progress + increment, 98.5) };
                }
                return item;
            });
        });
    }, intervalMs);

    try {
      const base64Images = await gemini.generateImage(prompt, genSettings, referenceImages, apiKey);
      
      clearInterval(progressInterval);
      
      const newImages: GeneratedImage[] = base64Images.map(b64 => ({
        id: generateId(),
        base64: b64,
        prompt: prompt || (referenceImages.length > 0 ? "Image Variation" : "Untitled"),
        timestamp: Date.now(),
        width: 1024,
        height: 1024,
        model: genSettings.model
      }));

      for (const img of newImages) await db.saveImage(img);
      setImages(prev => [...newImages, ...prev]);
      
    } catch (error: any) {
      handleGenError(error);
    } finally {
      clearInterval(progressInterval);
      setPendingImages(prev => prev.filter(item => !newPendingIds.includes(item.id)));
      setIsGenerating(false);
    }
  };

  const handleGenError = (error: any) => {
      console.error("Gen error:", error);
      const errorMsg = (error.message || error.toString());
      if (errorMsg.includes("SAFETY_BLOCK")) {
        const details = errorMsg.split("SAFETY_BLOCK")[1]?.replace(/^:/, '').trim();
        showError("生成失敗 (安全性)", `安全性のガイドラインによりブロックされました。\n${details || ''}`);
      } else if (errorMsg.includes("MODEL_REFUSAL")) {
          const reason = errorMsg.split("MODEL_REFUSAL:")[1]?.trim();
          showError("生成拒否", `モデルが生成を拒否しました。\n${reason || ''}`);
      } else {
        showError("エラー発生", `予期せぬエラーが発生しました。\n${errorMsg}`);
      }
  };

  // --- Chat Logic ---

  const handleSendChat = async (prompt: string, attachments: string[]) => {
      if (!prompt && attachments.length === 0) return;

      setIsGenerating(true);
      setIsChatThinking(chatSettings.thinkingBudget > 0);

      // 1. Get or Create Session
      let session = chatSessions.find(s => s.id === currentSessionId);
      const isNewSession = !session;
      
      if (!session) {
          session = {
              id: uuidv4(),
              title: "New Conversation",
              messages: [],
              updatedAt: Date.now(),
              isFavorite: false,
              settings: chatSettings
          };
      }

      // 2. Add User Message
      const userMsg: ChatMessage = {
          id: uuidv4(),
          role: 'user',
          text: prompt,
          attachments,
          timestamp: Date.now()
      };
      
      const updatedMessages = [...session.messages, userMsg];
      
      // Update local state immediately for responsiveness
      const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
      if (isNewSession) {
          setChatSessions([updatedSession, ...chatSessions]);
          setCurrentSessionId(updatedSession.id);
      } else {
          setChatSessions(chatSessions.map(s => s.id === updatedSession.id ? updatedSession : s));
      }

      try {
          // 3. Stream Response
          // Load system prompt content if ID exists
          let sysPromptContent = undefined;
          if (chatSettings.isSystemPromptEnabled && chatSettings.systemPromptId) {
              const savedPrompts = localStorage.getItem('nano_studio_system_prompts');
              if (savedPrompts) {
                  const parsed = JSON.parse(savedPrompts);
                  const p = parsed.find((i: any) => i.id === chatSettings.systemPromptId);
                  if (p) sysPromptContent = p.content;
              }
          }

          const modelMsgId = uuidv4();
          let modelTextAccumulator = "";
          
          // Optimistically add empty model message for streaming
          const modelMsg: ChatMessage = {
              id: modelMsgId,
              role: 'model',
              text: "",
              timestamp: Date.now(),
              isThinking: chatSettings.thinkingBudget > 0
          };
          
          // Update Session with placeholder
          const sessionWithModel = { ...updatedSession, messages: [...updatedMessages, modelMsg] };
          setChatSessions(prev => prev.map(s => s.id === session.id ? sessionWithModel : s));

          // Call API
          await gemini.streamChatResponse(
              session.messages, // History excluding the new message (service appends new message)
              prompt,           // New message text
              attachments,      // Attachments
              chatSettings,
              sysPromptContent,
              apiKey,
              (chunk) => {
                  modelTextAccumulator += chunk;
                  setIsChatThinking(false); // Stop thinking visual once first token arrives
                  
                  // Update UI with chunk
                  setChatSessions(current => {
                      return current.map(s => {
                          if (s.id === session!.id) {
                              const msgs = s.messages.map(m => 
                                  m.id === modelMsgId 
                                  ? { ...m, text: modelTextAccumulator, isThinking: false } 
                                  : m
                              );
                              return { ...s, messages: msgs };
                          }
                          return s;
                      });
                  });
              }
          );

          // 4. Final Save to DB
          const finalSession = {
              ...sessionWithModel,
              messages: [...updatedMessages, { ...modelMsg, text: modelTextAccumulator, isThinking: false }],
              updatedAt: Date.now()
          };
          
          // Generate Title if new
          if (isNewSession) {
              const title = await gemini.generateChatTitle(prompt, apiKey);
              finalSession.title = title;
          }

          await db.saveChat(finalSession);
          // Sync state one last time to be sure
          setChatSessions(prev => prev.map(s => s.id === finalSession.id ? finalSession : s));

      } catch (e: any) {
          handleGenError(e);
          setIsChatThinking(false);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleChatSessionSelect = (s: ChatSession) => {
      setCurrentSessionId(s.id);
      setIsChatHistoryOpen(false);
  };

  const handleNewChat = () => {
      setCurrentSessionId(null);
      setIsChatHistoryOpen(false);
  };

  const handleDeleteChat = async (id: string) => {
      await db.deleteChat(id);
      setChatSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
  };

  const handleToggleFavorite = async (id: string) => {
      const session = chatSessions.find(s => s.id === id);
      if (session) {
          const updated = { ...session, isFavorite: !session.isFavorite };
          await db.saveChat(updated);
          setChatSessions(prev => prev.map(s => s.id === id ? updated : s));
      }
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
      const session = chatSessions.find(s => s.id === id);
      if (session) {
          const updated = { ...session, title: newTitle };
          await db.saveChat(updated);
          setChatSessions(prev => prev.map(s => s.id === id ? updated : s));
      }
  };

  // Global Settings Actions
  const handleClearImages = async () => {
      const all = await db.getImages();
      for(const img of all) await db.deleteImage(img.id);
      setImages([]);
  };

  const handleClearChats = async () => {
      const all = await db.getChats();
      for(const chat of all) await db.deleteChat(chat.id);
      setChatSessions([]);
      setCurrentSessionId(null);
  };


  // --- Shared Logic ---

  const toggleSelect = (id: string) => {
    if (!selectionMode) setSelectionMode(true);
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      if (newSet.size === 0) setSelectionMode(false);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDownloadZip = async () => {
    const selectedImages = images.filter(img => selectedIds.has(img.id));
    if (selectedImages.length === 0) return;
    await zipService.downloadImagesAsZip(selectedImages);
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteImage = async (id: string) => {
      await db.deleteImage(id);
      setImages(prev => prev.filter(i => i.id !== id));
  };


  // --- Rendering ---
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-white">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  // Welcome / API Key Screen
  if (!apiKey) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

             <div className="max-w-md w-full space-y-8 z-10">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6">
                        <Sparkles size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Nano Studio</h1>
                    <p className="text-white/50 text-lg">Your Personal AI Creative Suite</p>
                </div>

                <div className="bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-xl space-y-6">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/80">APIキーを入力してください</label>
                        <div className="space-y-2">
                            <input 
                                type="password" 
                                placeholder="AIzaSy..." 
                                value={welcomeInputKey}
                                onChange={(e) => setWelcomeInputKey(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-white/20"
                            />
                            <p className="text-xs text-white/40 leading-relaxed">
                                キーは端末内（ローカルストレージ）にのみ保存され、外部サーバーには送信されません。
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => saveApiKey(welcomeInputKey)}
                        disabled={!welcomeInputKey}
                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            welcomeInputKey 
                            ? 'bg-white text-black hover:scale-[1.02] shadow-lg shadow-white/10' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                    >
                        始める <ArrowRight size={18} />
                    </button>
                    
                    <div className="pt-4 border-t border-white/5 text-center">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                            APIキーを取得 <ArrowRight size={12} />
                        </a>
                    </div>
                </div>
             </div>
        </div>
    );
  }

  const currentChatSession = chatSessions.find(s => s.id === currentSessionId);

  return (
    <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden">
      
      {/* Toast */}
      {errorToast && (
        <div className="fixed top-0 left-0 right-0 z-[60] p-4 flex justify-center animate-slide-up pointer-events-none">
          <div className="bg-red-500/90 text-white backdrop-blur-md rounded-2xl shadow-2xl max-w-sm w-full p-4 flex gap-4 pointer-events-auto border border-white/10">
            <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-sm leading-none">{errorToast.title}</h3>
              <p className="text-xs opacity-90 whitespace-pre-wrap">{errorToast.message}</p>
            </div>
            <button onClick={() => setErrorToast(null)}><XCircle size={20} /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-20 p-4 transition-all duration-300 ${mode === AppMode.GALLERY ? 'bg-surface/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent pointer-events-none'}`}>
        <div className="flex justify-between items-center max-w-7xl mx-auto">
             <h1 className={`font-bold text-lg tracking-tight transition-opacity ${mode === AppMode.GALLERY ? 'opacity-100' : 'opacity-0'}`}>
               ギャラリー <span className="text-white/40 text-sm font-normal ml-2">{images.length} 枚</span>
             </h1>
             {mode === AppMode.GALLERY && (
                 <div className="flex gap-1 pointer-events-auto">
                    {[2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setGridCols(n)} className={`w-6 h-6 flex items-center justify-center rounded text-xs ${gridCols === n ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>{n}</button>
                    ))}
                 </div>
             )}
        </div>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-500 max-w-7xl mx-auto min-h-screen ${mode === AppMode.GALLERY ? 'pt-20 px-2' : ''}`}>
         {mode === AppMode.GALLERY ? (
             <GalleryGrid 
                images={images}
                pendingImages={pendingImages}
                columns={gridCols}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onImageClick={(img) => setViewingImage(img)}
            />
         ) : mode === AppMode.GENERATE ? (
             // Image Generation Mode (Empty mainly, handled by PromptInput overlay)
             <div /> 
         ) : (
             // Chat Mode
             <ChatInterface 
                messages={currentChatSession?.messages || []} 
                isThinking={isChatThinking}
             />
         )}
      </main>

      {/* Chat History Drawer */}
      <ChatHistory 
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
        sessions={chatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleChatSessionSelect}
        onDeleteSession={handleDeleteChat}
        onToggleFavorite={handleToggleFavorite}
        onRenameSession={handleRenameSession}
        onNewChat={handleNewChat}
      />

      {/* Input Overlay */}
      {isInputVisible && (
        <div 
            className="fixed inset-0 z-30"
            // Clicking outside the input box (the overlay) closes the input
            onClick={(e) => {
                // If it's a direct click on the overlay, close input
                if (e.target === e.currentTarget) {
                    setIsInputVisible(false);
                }
            }}
        >
            <div className="pointer-events-auto">
                <PromptInput 
                    isVisible={isInputVisible}
                    onGenerate={mode === AppMode.CHAT ? handleSendChat : handleGenerateImage}
                    isGenerating={isGenerating}
                    onOpenSettings={() => mode === AppMode.CHAT ? setIsChatSettingsOpen(true) : setIsSettingsOpen(true)}
                    mode={mode}
                />
            </div>
        </div>
      )}

      {/* Radial Menu (FAB) */}
      <RadialMenu 
        mode={mode}
        onSwitchMode={handleSwitchMode}
        onToggleInput={() => setIsInputVisible(!isInputVisible)}
        onToggleHistory={() => setIsChatHistoryOpen(true)}
        selectionMode={selectionMode}
        onToggleSelection={() => {
            setSelectionMode(!selectionMode);
            if(selectionMode) setSelectedIds(new Set());
        }}
        hasSelection={selectedIds.size > 0}
        onDownload={handleDownloadZip}
        onCancelSelection={() => {
            setSelectionMode(false);
            setSelectedIds(new Set());
        }}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsGlobalSettingsOpen(true)}
        
        // Favorite Logic
        onToggleFavorite={() => currentSessionId && handleToggleFavorite(currentSessionId)}
        isCurrentSessionFavorite={currentChatSession?.isFavorite || false}

        // HIDE FAB WHEN INPUT IS VISIBLE (Regardless of mode) to avoid overlap
        isHidden={isInputVisible} 
      />

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={genSettings}
        setSettings={setGenSettings}
      />

      <ChatSettingsModal 
        isOpen={isChatSettingsOpen}
        onClose={() => setIsChatSettingsOpen(false)}
        settings={chatSettings}
        setSettings={setChatSettings}
      />

      <GlobalSettingsModal 
        isOpen={isGlobalSettingsOpen}
        onClose={() => setIsGlobalSettingsOpen(false)}
        onClearImages={handleClearImages}
        onClearChats={handleClearChats}
        currentApiKey={apiKey}
        onSaveApiKey={saveApiKey}
      />

      <ImageViewer 
        image={viewingImage}
        onClose={() => setViewingImage(null)}
        onDelete={handleDeleteImage}
        onDownload={zipService.downloadSingleImage}
      />

    </div>
  );
}

export default App;