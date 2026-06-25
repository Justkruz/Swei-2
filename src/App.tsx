import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Bot, User, Network, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Role = 'user' | 'teacher' | 'learner';

interface Message {
  id: string;
  role: Role;
  content: string;
  label?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-greeting',
      role: 'learner',
      content: "Hello! I am S.W.E.I (Smart Web Evolving Intelligence). I am currently in Observation Mode. Ask a question, and I will observe the Teacher's reasoning and extract structured parameters for my knowledge graph.",
      label: "S.W.E.I. System",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTypingTeacher, setIsTypingTeacher] = useState(false);
  const [isTypingLearner, setIsTypingLearner] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTypingTeacher, isTypingLearner]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const processLearnerExtraction = async (teacherText: string) => {
    setIsTypingLearner(true);
    
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: teacherText })
      });

      const jsonRes = await res.json();
      setIsTypingLearner(false);

      if (res.ok && jsonRes.data) {
        // Pretty print the JSON string from the server if it's already a string,
        // otherwise stringify it.
        let formattedData = typeof jsonRes.data === 'string' ? jsonRes.data : JSON.stringify(jsonRes.data, null, 2);
        
        try {
          // Attempt to parse and re-stringify to ensure nice formatting
          const parsed = JSON.parse(formattedData);
          formattedData = JSON.stringify(parsed, null, 2);
        } catch (e) {
          // Ignore, use raw format
        }

        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'learner',
          content: formattedData,
          label: 'S.W.E.I. Structured Output'
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'learner',
          content: `Error extracting data: ${jsonRes.error}`,
          label: 'S.W.E.I. Error'
        }]);
      }
    } catch (err) {
      setIsTypingLearner(false);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'learner',
        content: 'Failed to connect to extraction service.',
        label: 'S.W.E.I. Error'
      }]);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      label: 'User Input'
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setIsTypingTeacher(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });

      const data = await res.json();
      setIsTypingTeacher(false);

      if (res.ok && data.text) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'teacher',
          content: data.text,
          label: 'Gemini Teacher'
        }]);
        processLearnerExtraction(data.text);
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'teacher',
          content: `Error: ${data.error || 'Failed to get response'}`,
          label: 'Gemini Teacher'
        }]);
      }
    } catch (err) {
      setIsTypingTeacher(false);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'teacher',
        content: 'Error communicating with the server.',
        label: 'System Error'
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Header */}
      <header className="flex items-center px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3 w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Network size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-100 tracking-tight leading-none">S.W.E.I. Workspace</h1>
            <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Observation Mode Active
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-6 bg-[#0a0a0a]">
        <div className="flex flex-col max-w-5xl mx-auto gap-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col max-w-[90%] sm:max-w-[80%] gap-1.5`}>
                  {/* Label */}
                  <div className={`text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                    msg.role === 'user' ? 'text-neutral-500 justify-end' : 
                    msg.role === 'teacher' ? 'text-indigo-400' : 'text-emerald-400'
                  }`}>
                    {msg.role === 'teacher' && <Sparkles size={12} />}
                    {msg.role === 'learner' && <Network size={12} />}
                    {msg.label}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                      msg.role === 'user' ? 'bg-neutral-800 text-neutral-400' : 
                      msg.role === 'teacher' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : 
                       msg.role === 'teacher' ? <Bot size={16} /> : <Network size={16} />}
                    </div>
                    <div className="relative group">
                      <div
                        className={`px-5 py-4 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-neutral-800 text-neutral-100 rounded-tr-sm border border-neutral-700'
                            : msg.role === 'teacher'
                            ? 'bg-neutral-900 border border-indigo-500/20 text-neutral-300 rounded-tl-sm font-light'
                            : 'bg-black border border-emerald-500/30 text-emerald-400 rounded-tl-sm font-mono text-sm pr-12'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === 'learner' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Copy JSON"
                        >
                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Teacher Typing */}
            {isTypingTeacher && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full justify-start">
                <div className="flex flex-col gap-1.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles size={12} /> Gemini Teacher
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Bot size={16} />
                    </div>
                    <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-neutral-900 border border-indigo-500/20 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Learner Typing */}
            {isTypingLearner && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full justify-start mt-2">
                <div className="flex flex-col gap-1.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Network size={12} /> S.W.E.I. System
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Network size={16} />
                    </div>
                    <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-black border border-emerald-500/30 flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-500/60">Observing and extracting parameters...</span>
                      <span className="w-1 h-3 bg-emerald-500 animate-pulse ml-2" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-5 border-t border-neutral-800 bg-neutral-950 shrink-0 z-10">
        <div className="max-w-5xl mx-auto relative flex items-end gap-3 bg-neutral-900 border border-neutral-700 rounded-2xl px-4 py-3 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all shadow-lg">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Instruct the system..."
            className="w-full max-h-[200px] bg-transparent text-neutral-100 placeholder-neutral-500 outline-none resize-none py-1.5 px-1 text-base sm:text-sm font-medium"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTypingTeacher || isTypingLearner}
            className="flex-shrink-0 mb-1 flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 text-neutral-950 hover:bg-emerald-400 hover:text-neutral-950 disabled:opacity-30 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all"
            title="Send Message"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
