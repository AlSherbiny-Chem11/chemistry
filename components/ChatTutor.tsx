
import React, { useState, useRef, useEffect } from 'react';
import { chatWithTutor } from '../services/geminiService';
import { Send, Sparkles, Loader2, FlaskConical } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const ChatTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Welcome to the Lab! 👨‍🔬 I am the Assistant to Professor Mohamed El Sherbiny. How can I help you master chemistry today? Ask me about valence electrons, stoichiometry, or organic functional groups!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await chatWithTutor(history, userMessage);
      setMessages(prev => [...prev, { role: 'model', text: response || "My circuits got crossed! Let's re-analyze that question. 🔬" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "A technical error occurred in the lab. Please try again! ⚛️" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-14rem)] flex flex-col bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-xl shadow-blue-900/40 border border-blue-400/20">
            🧪
          </div>
          <div>
            <h3 className="text-2xl font-black">AI Academy Assistant</h3>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Research Protocol</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end opacity-40">
           <span className="text-[10px] font-black uppercase tracking-widest">Chemistry Module</span>
           <span className="text-[10px] font-black uppercase tracking-widest">v2.5 Pro</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[85%] px-8 py-5 rounded-[2.2rem] shadow-sm text-base font-medium leading-loose ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-blue-100' 
                : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-slate-200/50'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 px-8 py-5 rounded-[2.2rem] rounded-bl-none flex items-center gap-3">
               <span className="text-xs font-black text-slate-400 animate-pulse">Assistant is analyzing...</span>
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query the database (e.g. 'What is the mole concept?')"
            className="w-full pl-8 pr-20 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:bg-white focus:border-blue-400 outline-none transition-all font-bold placeholder:text-slate-300 shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center hover:bg-blue-500 hover:shadow-2xl transition-all disabled:opacity-30"
          >
            {isTyping ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
          </button>
        </form>
        <div className="mt-6 flex justify-center gap-8">
           <ChatFeature icon="⚗️" label="Equations" />
           <ChatFeature icon="🧬" label="Structures" />
           <ChatFeature icon="📊" label="Analysis" />
        </div>
      </div>
    </div>
  );
};

const ChatFeature = ({ icon, label }: { icon: string, label: string }) => (
  <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity cursor-default">
    <span className="text-lg">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
  </div>
);

export default ChatTutor;
