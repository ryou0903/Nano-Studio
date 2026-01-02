import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isThinking?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isThinking }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40 pt-20">
       {messages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-[50vh] opacity-30 text-center px-4">
               <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mb-4 blur-sm opacity-50">
                   <Sparkles size={32} className="text-white" />
               </div>
               <p className="text-lg font-medium">Gemini 3 Mode</p>
               <p className="text-sm">何か話しかけてください。</p>
           </div>
       )}

       {messages.map((msg) => (
           <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               {/* Avatar */}
               <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-white/10' : 'bg-gradient-to-br from-primary to-purple-500'}`}>
                   {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} className="text-white" />}
               </div>

               {/* Bubble */}
               <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   {/* Attachments */}
                   {msg.attachments && msg.attachments.length > 0 && (
                       <div className="flex flex-wrap gap-2 mb-2">
                           {msg.attachments.map((att, i) => (
                               <img key={i} src={att} alt="Attachment" className="w-32 h-32 object-cover rounded-lg border border-white/10" />
                           ))}
                       </div>
                   )}
                   
                   {/* Text */}
                   <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                       msg.role === 'user' 
                       ? 'bg-white/10 text-white rounded-tr-none' 
                       : 'bg-transparent text-white/90 prose prose-invert max-w-none'
                   }`}>
                        {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                            </ReactMarkdown>
                        )}
                   </div>
               </div>
           </div>
       ))}

       {/* Thinking Indicator */}
       {isThinking && (
           <div className="flex gap-4">
               <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-gradient-to-br from-primary to-purple-500">
                   <Sparkles size={16} className="text-white" />
               </div>
               <div className="bg-transparent px-4 py-3">
                   <div className="flex gap-2 items-center text-white/50 text-xs">
                       <Loader2 size={12} className="animate-spin" />
                       Thinking...
                   </div>
               </div>
           </div>
       )}
       
       <div ref={bottomRef} />
    </div>
  );
};

export default ChatInterface;
