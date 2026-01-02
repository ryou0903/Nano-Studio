import React, { useState } from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Star, Trash2, Edit2, X, Search, SquarePen } from 'lucide-react';

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onNewChat?: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen, onClose, sessions, currentSessionId, onSelectSession, onDeleteSession, onToggleFavorite, onRenameSession, onNewChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Swipe State
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const filteredSessions = sessions.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
      if (showFavoritesOnly) return matchesSearch && s.isFavorite;
      return matchesSearch;
  });
  
  // Grouping (Only if not filtering by favorite explicitly)
  const favorites = !showFavoritesOnly ? filteredSessions.filter(s => s.isFavorite) : [];
  const recents = !showFavoritesOnly ? filteredSessions.filter(s => !s.isFavorite) : filteredSessions;

  // --- Swipe Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
      if (touchStart === null) return;
      const currentTouch = e.targetTouches[0].clientX;
      const diff = touchStart - currentTouch;
      
      // Simple threshold to trigger "swiped state"
      if (diff > 50) { // Swipe Left (Archive/Fav)
          setSwipedId(id);
      } else if (diff < -50) { // Swipe Right (Close actions)
          if (swipedId === id) setSwipedId(null);
      }
  };
  
  const handleTouchEnd = () => {
      setTouchStart(null);
  };

  const handleRenameSubmit = (id: string) => {
      if (editTitle.trim()) {
          onRenameSession(id, editTitle);
      }
      setEditingId(null);
  };

  return (
    <>
        {/* Backdrop - Visible when open, click to close */}
        {isOpen && (
            <div 
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
        )}

        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-surface border-r border-white/10 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-white">履歴</h2>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`p-2 rounded-full transition-colors ${showFavoritesOnly ? 'bg-accent text-white' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                            title="お気に入りのみ表示"
                        >
                            <Star size={20} fill={showFavoritesOnly ? "currentColor" : "none"} />
                        </button>
                        {onNewChat && (
                            <button onClick={onNewChat} className="p-2 hover:bg-white/10 rounded-full text-white/80" title="新規チャット">
                                <SquarePen size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <X size={20} className="text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 pb-2">
                    <div className="relative bg-white/5 rounded-xl">
                        <Search size={16} className="absolute left-3 top-3 text-white/30" />
                        <input 
                            type="text" 
                            placeholder="検索..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent p-2.5 pl-10 text-sm text-white outline-none placeholder-white/30"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    
                    {/* If showing only favorites, just render the list flat */}
                    {showFavoritesOnly ? (
                        <div className="space-y-2">
                             <h3 className="text-xs font-bold text-accent uppercase tracking-wider px-2">お気に入り ({filteredSessions.length})</h3>
                             {filteredSessions.length === 0 && (
                                <p className="text-white/30 text-sm px-2">お気に入りはありません</p>
                             )}
                             {filteredSessions.map(s => renderSessionItem(s))}
                        </div>
                    ) : (
                        <>
                            {/* Favorites Group */}
                            {favorites.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider px-2">お気に入り</h3>
                                    {favorites.map(s => renderSessionItem(s))}
                                </div>
                            )}

                            {/* Recents Group */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider px-2">最近</h3>
                                {recents.length === 0 && favorites.length === 0 && (
                                    <p className="text-white/30 text-sm px-2">履歴はありません</p>
                                )}
                                {recents.map(s => renderSessionItem(s))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    </>
  );

  function renderSessionItem(session: ChatSession) {
      const isEditing = editingId === session.id;
      const isActive = currentSessionId === session.id;
      const isSwiped = swipedId === session.id;

      return (
          <div 
            key={session.id} 
            className="relative overflow-hidden group"
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, session.id)}
            onTouchEnd={handleTouchEnd}
          >
              {/* Background Actions (Visible when swiped) */}
              {isSwiped && (
                  <div className="absolute inset-0 flex items-center justify-end bg-surface z-10 animate-fade-in pl-12">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(session.id); setSwipedId(null); }}
                        className="h-full w-16 flex items-center justify-center bg-accent text-white"
                      >
                          <Star size={18} fill={session.isFavorite ? "white" : "none"} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className="h-full w-16 flex items-center justify-center bg-red-500 text-white"
                      >
                          <Trash2 size={18} />
                      </button>
                      <button 
                         onClick={(e) => { e.stopPropagation(); setSwipedId(null); }}
                         className="h-full w-12 flex items-center justify-center bg-white/10 text-white/50"
                      >
                          <X size={18} />
                      </button>
                  </div>
              )}

              {/* Main Content */}
              <div 
                className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${isActive ? 'bg-primary/20 text-white' : 'text-white/70 hover:bg-white/5'}`}
                onClick={() => {
                    if (isSwiped) setSwipedId(null);
                    else onSelectSession(session);
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setEditTitle(session.title);
                    setEditingId(session.id);
                }}
              >
                 <div className="flex-shrink-0">
                     {session.isFavorite ? <Star size={18} className="text-accent" fill="currentColor" /> : <MessageSquare size={18} />}
                 </div>
                 
                 {isEditing ? (
                     <div className="flex-1 flex gap-2">
                         <input 
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleRenameSubmit(session.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(session.id)}
                            className="bg-black/50 text-white text-sm rounded px-1 w-full outline-none"
                            onClick={(e) => e.stopPropagation()}
                         />
                     </div>
                 ) : (
                     <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-medium truncate">{session.title}</h4>
                         <p className="text-[10px] opacity-50 truncate">{new Date(session.updatedAt).toLocaleDateString()}</p>
                     </div>
                 )}
              </div>
          </div>
      );
  }
};

export default ChatHistory;