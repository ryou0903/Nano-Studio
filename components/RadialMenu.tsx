import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Sparkles, CheckSquare, X, Download, MessageSquare, Settings, LayoutGrid, Zap, SquarePen, Star } from 'lucide-react';
import { AppMode } from '../types';

interface RadialMenuProps {
  mode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  onToggleInput: () => void;
  onToggleSelection: () => void;
  onToggleHistory?: () => void;
  selectionMode: boolean;
  hasSelection: boolean;
  onDownload: () => void;
  onCancelSelection: () => void;
  onNewChat?: () => void;
  onOpenSettings: () => void;
  onToggleFavorite: () => void;
  isCurrentSessionFavorite: boolean;
  isHidden?: boolean;
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  action: () => void;
  color?: string;
  bgColor?: string;
  group: 'vertical' | 'horizontal'; // Layout group
}

const RadialMenu: React.FC<RadialMenuProps> = ({
  mode,
  onSwitchMode,
  onToggleInput,
  onToggleSelection,
  onToggleHistory,
  selectionMode,
  hasSelection,
  onDownload,
  onCancelSelection,
  onNewChat,
  onOpenSettings,
  onToggleFavorite,
  isCurrentSessionFavorite,
  isHidden
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Helper to handle navigation and input toggling
  const handleNav = (targetMode: AppMode) => {
      if (mode === targetMode) {
          // If already in mode, toggle input
          onToggleInput();
      } else {
          onSwitchMode(targetMode);
      }
  };

  // Define Menu Items
  const getItems = (): MenuItem[] => {
    const items: MenuItem[] = [];

    // --- 1. Horizontal Group (Persistent Navigation) ---
    // Order: Leftmost -> Rightmost (Closest to FAB)
    
    // Gemini Mode
    if (mode !== AppMode.CHAT) {
        items.push({
            id: 'nav_chat',
            icon: Sparkles,
            label: 'Gemini', // Label ignored in render
            action: () => handleNav(AppMode.CHAT),
            color: 'text-purple-400',
            group: 'horizontal'
        });
    }

    // Gallery Mode
    if (mode !== AppMode.GALLERY) {
        items.push({
            id: 'nav_gallery',
            icon: LayoutGrid,
            label: 'ギャラリー',
            action: () => handleNav(AppMode.GALLERY),
            color: 'text-white',
            group: 'horizontal'
        });
    }

    // Generate Mode
    if (mode !== AppMode.GENERATE) {
        items.push({
            id: 'nav_gen',
            icon: Zap,
            label: '生成',
            action: () => handleNav(AppMode.GENERATE),
            color: 'text-accent',
            group: 'horizontal'
        });
    }


    // --- 2. Vertical Group (Contextual) ---
    // Order: Bottom (Closest to FAB) -> Top

    // Context specific actions
    if (selectionMode) {
        items.push({
            id: 'action_cancel',
            icon: X,
            label: 'キャンセル',
            action: onCancelSelection,
            color: 'text-white',
            group: 'vertical'
        });
        if (hasSelection) {
            items.push({
                id: 'action_save',
                icon: Download,
                label: '保存',
                action: onDownload,
                color: 'text-black',
                bgColor: 'bg-white',
                group: 'vertical'
            });
        }
    } else {
        // Normal Mode Contexts
        if (mode === AppMode.CHAT) {
            items.push({
                id: 'action_history',
                icon: MessageSquare,
                label: '履歴',
                action: () => onToggleHistory && onToggleHistory(),
                color: 'text-white',
                group: 'vertical'
            });
            // Star Button (Above History)
            items.push({
                id: 'action_favorite',
                icon: Star,
                label: isCurrentSessionFavorite ? 'お気に入り解除' : 'お気に入り',
                action: onToggleFavorite,
                color: isCurrentSessionFavorite ? 'text-accent fill-current' : 'text-white',
                group: 'vertical'
            });
            items.push({
                id: 'action_new_chat',
                icon: SquarePen,
                label: '新規チャット',
                action: () => onNewChat && onNewChat(),
                color: 'text-white',
                group: 'vertical'
            });
        } else {
            // Image Modes
            items.push({
                id: 'action_select',
                icon: CheckSquare,
                label: '選択',
                action: onToggleSelection,
                color: 'text-white',
                group: 'vertical'
            });
        }
    }

    // Settings (Always Exception at Top)
    items.push({
        id: 'settings',
        icon: Settings,
        label: '設定',
        action: onOpenSettings,
        color: 'text-white/60',
        group: 'vertical'
    });

    return items;
  };

  const items = getItems();
  const verticalItems = items.filter(i => i.group === 'vertical').reverse(); // Render from Top down visual, but flex-col-reverse handles bottom-up
  const horizontalItems = items.filter(i => i.group === 'horizontal');

  // --- Handlers ---

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); // Prevent default touch actions
    e.stopPropagation(); // Stop propagation

    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    isLongPressRef.current = false;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setIsOpen(true);
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (isOpen && isLongPressRef.current) {
          const x = e.clientX;
          const y = e.clientY;

          const menuItems = document.querySelectorAll('[data-menu-id]');
          let foundId: string | null = null;

          menuItems.forEach((el) => {
              const rect = el.getBoundingClientRect();
              const padding = 20; // Hit area padding
              if (x >= rect.left - padding && x <= rect.right + padding && y >= rect.top - padding && y <= rect.bottom + padding) {
                  foundId = el.getAttribute('data-menu-id');
              }
          });

          setHoveredItemId(foundId);
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
    }
    const target = e.currentTarget as HTMLElement;
    try {
        target.releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (isLongPressRef.current) {
        // Was dragging
        if (hoveredItemId) {
            // Released over an item -> Execute
            const item = items.find(i => i.id === hoveredItemId);
            if (item) {
                handleItemClick(item.action);
            }
        }
    } else {
        // Was a short tap
        if (isOpen) {
            setIsOpen(false); // Close if already open
        } else {
            handleClick(); // Open Input or Selection Action
        }
    }
    
    setHoveredItemId(null);
    isLongPressRef.current = false;
  };

  const handleClick = () => {
      // Short Press Logic
      if (selectionMode) {
          if (hasSelection) onDownload();
          else onCancelSelection();
      } else {
          onToggleInput();
      }
  };

  const handleItemClick = (action: () => void) => {
      setTimeout(() => {
        action();
        setIsOpen(false);
        setHoveredItemId(null);
      }, 50);
  };

  // --- Render ---

  const renderMainButtonIcon = () => {
      if (isOpen) return <X size={32} className="text-black" />; // Always X when open
      
      if (selectionMode) {
          if (hasSelection) return <Download size={28} className="text-black" />;
          return <X size={28} className="text-white" />;
      }
      return <Plus size={32} className="text-white" />;
  };

  const mainBtnBg = (isOpen || (selectionMode && hasSelection)) 
    ? 'bg-white' 
    : (selectionMode ? 'bg-red-500' : 'bg-zinc-700 text-white');

  return (
    <>
        {/* Backdrop - Click to close */}
        {isOpen && (
            <div 
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
                onPointerDown={() => setIsOpen(false)} 
            />
        )}

        {/* Menu Container */}
        <div 
            className={`fixed bottom-8 right-6 z-50 transition-all duration-300 ${
                isHidden ? 'translate-x-32 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
            }`}
        >
            {/* Vertical Items (Contextual) - Above FAB */}
            <div className={`absolute bottom-20 right-0 flex flex-col-reverse gap-4 items-center transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                {verticalItems.map((item, idx) => {
                    const isHovered = hoveredItemId === item.id;
                    return (
                        <div key={item.id} className="relative flex items-center justify-end group">
                            {/* Label (Always visible when open) */}
                            <div className={`absolute right-14 bg-white/90 text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                {item.label}
                            </div>

                            {/* Icon */}
                            <button
                                data-menu-id={item.id}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleItemClick(item.action); }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-transform duration-200 ${item.bgColor || 'bg-surface'} text-white ${isHovered ? 'scale-125 ring-2 ring-white/50 z-20' : 'hover:scale-110 z-10'}`}
                            >
                                <item.icon size={20} className={item.color} fill={item.id === 'action_favorite' && isCurrentSessionFavorite ? "currentColor" : "none"} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Horizontal Items (Navigation) - Left of FAB */}
            <div className={`absolute bottom-0 right-20 flex flex-row-reverse gap-4 items-center transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                {horizontalItems.map((item, idx) => {
                    const isHovered = hoveredItemId === item.id;
                    return (
                        <div key={item.id} className="relative flex flex-col items-center justify-center">
                            {/* NO LABELS for horizontal items */}
                            
                            {/* Icon */}
                            <button
                                data-menu-id={item.id}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleItemClick(item.action); }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-transform duration-200 ${item.bgColor || 'bg-surface'} text-white ${isHovered ? 'scale-125 ring-2 ring-white/50 z-20' : 'hover:scale-110 z-10'}`}
                            >
                                <item.icon size={20} className={item.color} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Main FAB */}
            <button
                ref={buttonRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: 'none' }}
                className={`relative z-30 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-90 ${mainBtnBg}`}
            >
                {renderMainButtonIcon()}
            </button>
        </div>
    </>
  );
};

export default RadialMenu;