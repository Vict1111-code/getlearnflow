import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AIModeId, getMode } from '@/lib/ai-modes';
import { serializeContext, LearningContext } from '@/hooks/useLearningContext';

export interface AIAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  attachments?: AIAttachment[];
  mode?: AIModeId;
}

export interface AIChat {
  id: string;
  title: string;
  mode: AIModeId;
  pinned: boolean;
  favorite: boolean;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AIAssistantContextValue {
  chats: AIChat[];
  activeChatId: string | null;
  activeChat: AIChat | null;
  mode: AIModeId;
  setMode: (m: AIModeId) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  isSending: boolean;
  isLoadingChats: boolean;
  newChat: (mode?: AIModeId) => string;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  sendMessage: (text: string, attachments?: AIAttachment[]) => Promise<void>;
  regenerate: () => Promise<void>;
  setLearningContext: (ctx: LearningContext | undefined) => void;
}

const AIAssistantContext = createContext<AIAssistantContextValue | null>(null);
const ACTIVE_KEY = 'learnflow:ai:active';
const MODE_KEY = 'learnflow:ai:mode';
const CACHE_KEY = 'learnflow:ai:cache';

const uid = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11));

function loadCache(): AIChat[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<AIChat[]>(() => loadCache());
  const [activeChatId, setActiveChatId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const [mode, setModeState] = useState<AIModeId>(() => {
    const stored = localStorage.getItem(MODE_KEY) as AIModeId | null;
    const valid: AIModeId[] = ['explain', 'quiz', 'review'];
    return stored && valid.includes(stored) ? stored : 'explain';
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const ctxRef = useRef<LearningContext | undefined>(undefined);

  // Persist active id and mode locally for snappy boot
  useEffect(() => { if (activeChatId) localStorage.setItem(ACTIVE_KEY, activeChatId); else localStorage.removeItem(ACTIVE_KEY); }, [activeChatId]);
  useEffect(() => { localStorage.setItem(MODE_KEY, mode); }, [mode]);
  useEffect(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(chats.slice(0, 100))); } catch {}
  }, [chats]);

  // Load chats from DB on auth
  useEffect(() => {
    if (!user) { setChats([]); return; }
    let cancelled = false;
    (async () => {
      setIsLoadingChats(true);
      try {
        const { data: chatRows, error: chatErr } = await supabase
          .from('ai_chats').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
        if (chatErr) throw chatErr;
        const ids = (chatRows || []).map(c => c.id);
        let msgRows: any[] = [];
        if (ids.length > 0) {
          const { data: m, error: mErr } = await supabase
            .from('ai_chat_messages').select('*').in('chat_id', ids).order('created_at', { ascending: true });
          if (mErr) throw mErr;
          msgRows = m || [];
        }
        if (cancelled) return;
        const grouped = new Map<string, AIMessage[]>();
        for (const m of msgRows) {
          const arr = grouped.get(m.chat_id) || [];
          arr.push({
            id: m.id, role: m.role, content: m.content,
            createdAt: new Date(m.created_at).getTime(),
            attachments: m.attachments || undefined,
            mode: m.mode || undefined,
          });
          grouped.set(m.chat_id, arr);
        }
        const merged: AIChat[] = (chatRows || []).map(c => ({
          id: c.id, title: c.title, mode: (c.mode || 'explain') as AIModeId,
          pinned: !!c.pinned, favorite: !!c.favorite,
          messages: grouped.get(c.id) || [],
          createdAt: new Date(c.created_at).getTime(),
          updatedAt: new Date(c.updated_at).getTime(),
        }));
        setChats(merged);
      } catch (e) {
        console.error('Failed to load AI chats', e);
      } finally {
        if (!cancelled) setIsLoadingChats(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const setMode = useCallback((m: AIModeId) => setModeState(m), []);
  const setLearningContext = useCallback((c: LearningContext | undefined) => { ctxRef.current = c; }, []);

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) ?? null, [chats, activeChatId]);

  const newChat = useCallback((m?: AIModeId): string => {
    const id = uid();
    const chosen = m ?? mode;
    const chat: AIChat = {
      id, title: 'New chat', mode: chosen, pinned: false, favorite: false,
      messages: [], createdAt: Date.now(), updatedAt: Date.now(),
    };
    setChats(prev => [chat, ...prev]);
    setActiveChatId(id);
    if (m) setModeState(m);
    if (user) {
      supabase.from('ai_chats').insert({ id, user_id: user.id, title: chat.title, mode: chosen }).then(({ error }) => {
        if (error) console.error('persist new chat', error);
      });
    }
    return id;
  }, [mode, user]);

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
    const c = chats.find(x => x.id === id);
    if (c) setModeState(c.mode);
  }, [chats]);

  const deleteChat = useCallback((id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    setActiveChatId(curr => (curr === id ? null : curr));
    if (user) supabase.from('ai_chats').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
  }, [user]);

  const renameChat = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setChats(prev => prev.map(c => c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c));
    if (user) supabase.from('ai_chats').update({ title: trimmed }).eq('id', id);
  }, [user]);

  const togglePin = useCallback((id: string) => {
    setChats(prev => {
      const next = prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
      const target = next.find(c => c.id === id);
      if (user && target) supabase.from('ai_chats').update({ pinned: target.pinned }).eq('id', id);
      return next;
    });
  }, [user]);
  const toggleFavorite = useCallback((id: string) => {
    setChats(prev => {
      const next = prev.map(c => c.id === id ? { ...c, favorite: !c.favorite } : c);
      const target = next.find(c => c.id === id);
      if (user && target) supabase.from('ai_chats').update({ favorite: target.favorite }).eq('id', id);
      return next;
    });
  }, [user]);

  const callBackend = useCallback(async (chat: AIChat) => {
    const modeMeta = getMode(chat.mode);
    const contextStr = serializeContext(ctxRef.current);
    const messages = chat.messages.map(m => {
      let content = m.content;
      if (m.attachments?.length) {
        const att = m.attachments.map(a =>
          `\n[attachment] ${a.name} (${a.type || 'file'}, ${Math.round(a.size / 1024)}KB)` +
          (a.preview ? `\n---\n${a.preview.slice(0, 4000)}\n---` : '')
        ).join('');
        content += att;
      }
      return { role: m.role, content };
    });
    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: { kind: 'chat', payload: { messages, context: contextStr, mode_hint: `${modeMeta.label} — ${modeMeta.systemHint}` } },
    });
    if (error) throw new Error(error.message || 'AI request failed');
    if ((data as any)?.error) throw new Error((data as any).error);
    return (data as any).output?.message as string;
  }, []);

  const persistMessage = async (chatId: string, msg: AIMessage) => {
    if (!user) return;
    const { error } = await supabase.from('ai_chat_messages').insert({
      id: msg.id, chat_id: chatId, user_id: user.id,
      role: msg.role, content: msg.content,
      attachments: msg.attachments ? (msg.attachments as any) : null,
      mode: msg.mode || null,
    });
    if (error) console.error('persist message', error);
    await supabase.from('ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
  };

  const sendMessage = useCallback(async (text: string, attachments?: AIAttachment[]) => {
    let chatId = activeChatId;
    let baseChat: AIChat | undefined = chats.find(c => c.id === chatId);
    if (!chatId || !baseChat) {
      chatId = uid();
      baseChat = { id: chatId, title: text.slice(0, 48) || 'New chat', mode, pinned: false, favorite: false, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      setChats(prev => [baseChat!, ...prev]);
      setActiveChatId(chatId);
      if (user) await supabase.from('ai_chats').insert({ id: chatId, user_id: user.id, title: baseChat.title, mode });
    }
    const userMsg: AIMessage = { id: uid(), role: 'user', content: text, createdAt: Date.now(), attachments, mode };
    const titleUpdate = baseChat.messages.length === 0 ? text.slice(0, 48) : baseChat.title;
    const updated: AIChat = {
      ...baseChat, mode, title: titleUpdate,
      messages: [...baseChat.messages, userMsg], updatedAt: Date.now(),
    };
    setChats(prev => prev.map(c => c.id === chatId ? updated : c));
    if (user && titleUpdate !== baseChat.title) {
      supabase.from('ai_chats').update({ title: titleUpdate }).eq('id', chatId);
    }
    persistMessage(chatId, userMsg);

    setIsSending(true);
    try {
      const reply = await callBackend(updated);
      const aiMsg: AIMessage = { id: uid(), role: 'assistant', content: reply || '…', createdAt: Date.now(), mode };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: Date.now() } : c));
      persistMessage(chatId, aiMsg);
    } catch (e: any) {
      toast.error(e.message || 'AI request failed');
      const errMsg: AIMessage = { id: uid(), role: 'assistant', content: `⚠️ ${e.message || 'Something went wrong.'}`, createdAt: Date.now(), mode };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() } : c));
      persistMessage(chatId, errMsg);
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, chats, mode, user, callBackend]);

  const regenerate = useCallback(async () => {
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || chat.messages.length === 0) return;
    const lastAssistantIdx = [...chat.messages].reverse().findIndex(m => m.role === 'assistant');
    if (lastAssistantIdx === -1) return;
    const removed = chat.messages[chat.messages.length - 1 - lastAssistantIdx];
    const newMsgs = chat.messages.slice(0, chat.messages.length - 1 - lastAssistantIdx);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, messages: newMsgs } : c));
    if (user) await supabase.from('ai_chat_messages').delete().eq('id', removed.id);
    setIsSending(true);
    try {
      const working: AIChat = { ...chat, messages: newMsgs };
      const reply = await callBackend(working);
      const aiMsg: AIMessage = { id: uid(), role: 'assistant', content: reply || '…', createdAt: Date.now(), mode: chat.mode };
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, messages: [...newMsgs, aiMsg], updatedAt: Date.now() } : c));
      persistMessage(chat.id, aiMsg);
    } catch (e: any) {
      toast.error(e.message || 'AI request failed');
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, chats, user, callBackend]);

  const value: AIAssistantContextValue = {
    chats, activeChatId, activeChat, mode, setMode,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    toggleDrawer: () => setDrawerOpen(v => !v),
    isSending, isLoadingChats,
    newChat, selectChat, deleteChat, renameChat, togglePin, toggleFavorite,
    sendMessage, regenerate, setLearningContext,
  };

  return <AIAssistantContext.Provider value={value}>{children}</AIAssistantContext.Provider>;
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) throw new Error('useAIAssistant must be used within AIAssistantProvider');
  return ctx;
}
