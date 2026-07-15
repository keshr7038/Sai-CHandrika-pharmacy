import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Bot,
  Send,
  User,
  Package,
  Calendar,
  TrendingUp,
  Truck,
  Heart,
  HelpCircle,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Check Stock', icon: Package, query: 'Check stock', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { label: 'Expiry Alerts', icon: Calendar, query: 'Expiry alerts', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  { label: 'Sales Report', icon: TrendingUp, query: 'Sales report', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
  { label: 'Vendor Status', icon: Truck, query: 'Vendor status', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
  { label: 'Health Tips', icon: Heart, query: 'Health tips', color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  { label: 'Get Help', icon: HelpCircle, query: 'What can you help with?', color: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
];

/**
 * Format AI message content:
 * - **text** -> <strong>text</strong>
 * - Lines starting with • or - become list items
 * - Newlines become <br/>
 */
function formatMessageContent(content) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 ml-1">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
              <span>{parseBold(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Bullet point line
    if (/^[•\-]\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^[•\-]\s+/, ''));
    }
    // Numbered list line (e.g. 1. **something**)
    else if (/^\d+\.\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s+/, ''));
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<br key={`br-${idx}`} />);
      } else {
        elements.push(
          <p key={`p-${idx}`} className="text-sm leading-relaxed">
            {parseBold(trimmed)}
          </p>
        );
      }
    }
  });

  flushList();
  return elements;
}

/** Parse **bold** markers into <strong> elements */
function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-800 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function AIChat() {
  const { aiMessages, sendAiMessage, user } = useContext(AppContext);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessageCount = useRef(aiMessages.length);

  // Detect when AI is "typing" (user sent message, waiting for assistant reply)
  useEffect(() => {
    const lastMsg = aiMessages[aiMessages.length - 1];
    if (lastMsg && lastMsg.role === 'user') {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [aiMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (aiMessages.length !== prevMessageCount.current) {
      prevMessageCount.current = aiMessages.length;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [aiMessages]);

  // Recent user topics for sidebar
  const recentTopics = useMemo(() => {
    return aiMessages
      .filter((m) => m.role === 'user')
      .slice(-3)
      .reverse();
  }, [aiMessages]);

  const handleSend = () => {
    const msg = inputValue.trim();
    if (!msg) return;
    sendAiMessage(msg);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (query) => {
    sendAiMessage(query);
    inputRef.current?.focus();
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const userInitials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-180px)] min-h-[500px] animate-fade-in">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 lg:max-h-full overflow-y-auto">
        {/* AI Header Card */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
              }}
            >
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                AI Assistant
              </h2>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white mt-0.5"
                style={{
                  background: 'linear-gradient(135deg, #2E7D32, #66BB6A)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                Powered by Sai Chandrika AI
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            Your intelligent medical assistant. Ask about medicines, stock, health tips, or shop management.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="card p-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.query)}
                  className="card p-3 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-200 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-all duration-200 group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Topics */}
        {recentTopics.length > 0 && (
          <div className="card p-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              Recent Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentTopics.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleQuickAction(msg.content)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/30 dark:hover:text-primary-400 transition-colors cursor-pointer truncate max-w-[180px]"
                  title={msg.content}
                >
                  {msg.content}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
            }}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Sai Chandrika AI Medical Assistant
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                Online — Ready to help
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            <MessageSquare className="w-3 h-3" />
            {aiMessages.length} msgs
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                {msg.role === 'assistant' ? (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-1"
                    style={{
                      background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                    }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[10px] font-bold text-primary-700 dark:text-primary-400">
                      {userInitials}
                    </span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'assistant'
                      ? 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 border-l-[3px] border-l-primary-500 shadow-soft'
                      : 'bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40'
                  }`}
                >
                  <div className="text-gray-700 dark:text-slate-300">
                    {formatMessageContent(msg.content)}
                  </div>
                  <p
                    className={`text-[10px] mt-2 font-medium ${
                      msg.role === 'assistant'
                        ? 'text-gray-400 dark:text-slate-500'
                        : 'text-primary-400 dark:text-primary-600'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-2.5 max-w-[85%]">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                  }}
                >
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-soft">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-primary-400 animate-bounce-gentle"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary-400 animate-bounce-gentle"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary-400 animate-bounce-gentle"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              className="input flex-1"
              placeholder="Ask me anything about medicines, health, or your shop..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="btn-primary rounded-full w-11 h-11 p-0 flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2 text-center">
            Sai Chandrika AI can make mistakes. Verify medical information with qualified professionals.
          </p>
        </div>
      </div>
    </div>
  );
}
