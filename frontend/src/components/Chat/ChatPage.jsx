import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Plus, Trash2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '../../services/api';

const STORAGE_KEY = 'budgetai_chats';
const SUGGESTIONS = [
  "How should I start investing in a 401(k)?",
  "Am I spending too much on dining out?",
  "What's the difference between Roth and Traditional IRA?",
  "Based on my expenses, what should my emergency fund be?",
  "Explain the 50/30/20 budgeting rule for my situation",
  "How can I reduce my subscription costs?",
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveChats(chats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function chatTitle(messages) {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New Chat';
  const text = first.content;
  return text.length > 40 ? text.slice(0, 40) + '...' : text;
}

export default function ChatPage() {
  const [chats, setChats] = useState(loadChats);
  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = loadChats();
    return saved.length > 0 ? saved[0].id : null;
  });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const persist = useCallback((updated) => {
    setChats(updated);
    saveChats(updated);
  }, []);

  function startNewChat() {
    const newChat = { id: generateId(), messages: [], updatedAt: Date.now() };
    const updated = [newChat, ...chats];
    persist(updated);
    setActiveChatId(newChat.id);
    setInput('');
  }

  function deleteChat(id) {
    const updated = chats.filter((c) => c.id !== id);
    persist(updated);
    if (activeChatId === id) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null);
    }
  }

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || streaming) return;

    let chatId = activeChatId;
    let currentChats = chats;

    if (!chatId) {
      const newChat = { id: generateId(), messages: [], updatedAt: Date.now() };
      currentChats = [newChat, ...chats];
      chatId = newChat.id;
      persist(currentChats);
      setActiveChatId(chatId);
    }

    const chat = currentChats.find((c) => c.id === chatId);
    const newMessages = [...(chat?.messages || []), { role: 'user', content: userMsg }];

    const withPlaceholder = [...newMessages, { role: 'assistant', content: '' }];
    const updatedChats = currentChats.map((c) =>
      c.id === chatId ? { ...c, messages: withPlaceholder, updatedAt: Date.now() } : c
    );
    persist(updatedChats);
    setInput('');
    setStreaming(true);

    try {
      const reader = await streamChat(userMsg, newMessages.slice(0, -1));
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            if (raw === '[DONE]') break;
            try { assistantText += JSON.parse(raw); } catch { assistantText += raw; }
            const streaming_updated = currentChats.map((c) => {
              if (c.id !== chatId) return c;
              const msgs = [...newMessages, { role: 'assistant', content: assistantText }];
              return { ...c, messages: msgs, updatedAt: Date.now() };
            });
            setChats(streaming_updated);
          }
        }
      }

      const finalMessages = [...newMessages, { role: 'assistant', content: assistantText }];
      const finalChats = currentChats.map((c) =>
        c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c
      );
      persist(finalChats);
    } catch {
      const errMsg = 'Sorry, I encountered an error. Please check that your API key is set and try again.';
      const finalMessages = [...newMessages, { role: 'assistant', content: errMsg }];
      const finalChats = currentChats.map((c) =>
        c.id === chatId ? { ...c, messages: finalMessages, updatedAt: Date.now() } : c
      );
      persist(finalChats);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Chat history sidebar */}
      <div className="w-64 shrink-0 flex flex-col bg-white rounded-2xl border border-border">
        <div className="p-3 border-b border-border">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 && (
            <p className="text-xs text-text-muted text-center py-8 px-3">
              No conversations yet. Start a new chat!
            </p>
          )}
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveChatId(c.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                c.id === activeChatId
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{chatTitle(c.messages)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-text-muted hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Financial Advisor
          </h2>
          <p className="text-text-secondary mt-1">
            Ask me anything about budgeting, investing, 401(k), IRA, and more
          </p>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-white p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
            <h3 className="font-semibold text-lg text-text mb-2">Meet your Monify Advisor</h3>
            <p className="text-text-secondary text-sm max-w-md mb-6">
              I know your spending inside out and can help with budgeting,
              investing, retirement planning, and more. Just ask!
            </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:bg-surface-hover hover:border-primary/30 transition-all text-text-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white whitespace-pre-wrap'
                  : 'bg-surface-alt text-text border border-border'
              }`}
            >
              {!msg.content ? (
                <span className="flex items-center gap-2 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </span>
              ) : msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-ol:my-2 prose-ul:my-2 prose-headings:mt-3 prose-headings:mb-1.5 prose-strong:text-text">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about budgeting, 401(k), investing, or your spending..."
            disabled={streaming}
            className="flex-1 px-5 py-3 rounded-2xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            className="px-5 py-3 rounded-2xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
