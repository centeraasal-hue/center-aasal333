import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Minimize2,
  Bot,
  User,
  Phone,
  Tag,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { sendAiMessage } from '../services/api';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenCatalog: () => void;
  onOpenLoyalty: () => void;
}

export const AiAssistant: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenCatalog,
  onOpenLoyalty
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'يا هلا بيك في سنتر العسال لتجارة المفروشات بالإسكندرية! 🌸\nأنا مساعدك الذكي، شاطر وفاهم كل تفاصيل الملايات القطنية، البطاطين الإسباني والتركي، وعروض العرائس وكارت العسال. أي خدمة أو استفسار عيوني ليك!',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const reply = await sendAiMessage(query.trim());
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'عذراً يا فندم، حدث ضغط بسيط على السيرفر. يسعدنا جداً تواصلك المباشر مع فريق سنتر العسال عبر الهاتف أو واتساب على: 01277714100 ونحن بخدمتك فوراً!',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'عايزة أفضل طقم ملايات لتجهيز عروسة',
    'إيه أسعار البطاطين المورا والتركي؟',
    'إزاي أستفيد من كارت العسال والمكافآت؟',
    'عناوين الفروع ومواعيد العمل بالإسكندرية'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[95vw] sm:w-[420px] max-h-[620px] h-[85vh] bg-white rounded-3xl shadow-2xl border-2 border-sky-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-sky-700 text-white p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-sky-700 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
              <span>مساعد سنتر العسال</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-sm">
                ذكاء اصطناعي
              </span>
            </h3>
            <p className="text-[11px] text-cyan-100">متصل الآن • خبير مفروشات العسال</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-sky-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
                msg.sender === 'user'
                  ? 'bg-slate-700 text-white'
                  : 'bg-cyan-600 text-white shadow-xs'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 shadow-sm border border-sky-100 rounded-tl-none'
              }`}
            >
              {msg.text}
              <span
                className={`text-[9px] block mt-1.5 font-sans ${
                  msg.sender === 'user' ? 'text-cyan-200 text-left' : 'text-slate-400 text-right'
                }`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-sky-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions pills */}
      <div className="px-3 py-2 bg-white border-t border-sky-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="whitespace-nowrap bg-sky-50 hover:bg-sky-100 text-cyan-800 font-semibold px-2.5 py-1.5 rounded-full border border-sky-200 transition-colors cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-3 bg-white border-t border-sky-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="اكتب استفسارك هنا..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-sky-50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white p-2.5 rounded-2xl transition-colors cursor-pointer shadow-xs disabled:opacity-40"
            title="إرسال"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
