"use client";

import { useRef, useEffect, useState } from "react";
import {
  Send,
  Globe,
  CheckCheck,
  Loader2,
  Sparkles,
  Languages,
} from "lucide-react";
import Image from "next/image";
import { markMessagesAsRead, sendMessage, translateText } from "@/app/actions";
import { dictionaries, Language } from "@/lib/data";
import { pusherClient } from "@/lib/pusher"; // TEK MERKEZDEN BAĞLANTI (ÖNEMLİ)
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
  sender: {
    name: string | null;
    imageUrl: string | null;
    cultureContext?: string | null;
    religion?: string | null;
  };
};

type Props = {
  initialMessages: Message[];
  currentUserId: string;
  lang: Language;
};

export default function ChatInterface({
  initialMessages,
  currentUserId,
  lang,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<string[]>([]);

  const t = dictionaries[lang];

  // 1. OTO-SCROLL
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
    markMessagesAsRead();
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  // 2. REAL-TIME BAĞLANTI (GÜVENLİ VERSİYON)
  useEffect(() => {
    // Doğrudan 'new Pusher' oluşturmak yerine lib/pusher.ts'den geleni kullanıyoruz.
    // Bu sayede "WebSocket closing" hataları engellenir.
    const channel = pusherClient.subscribe("chat-channel");

    channel.bind("new-message", (data: Message) => {
      setMessages((prev) => {
        // Çift mesaj kontrolü
        if (prev.find((m) => m.id === data.id)) return prev;

        // Kendi gönderdiğimiz mesaj zaten ekranda mı? (Optimistic UI kontrolü)
        if (data.senderId === currentUserId) {
          const optimisticMatch = prev.find(
            (m) => m.id.startsWith("temp-") && m.content === data.content,
          );
          if (optimisticMatch) {
            // Geçici mesajı gerçek veriyle değiştir
            return prev.map((m) => (m.id === optimisticMatch.id ? data : m));
          }
        }
        return [...prev, data];
      });

      // Mesaj gelince sesi çalabilir veya titretme ekleyebilirsin
    });

    // TEMİZLİK (Component kapanırsa bağlantıyı kes)
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUserId]);

  // 3. MESAJ GÖNDERME
  async function handleSendMessage(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    setIsSending(true);
    formRef.current?.reset();

    // Optimistic UI (Hemen ekrana bas)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: {
        name: "Ben",
        imageUrl: null,
        cultureContext: "Global",
        religion: "-",
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(formData);
    } catch (error) {
      console.error("Mesaj gitmedi:", error);
    } finally {
      setIsSending(false);
    }
  }

  // 4. ÇEVİRİ İŞLEMİ
  const handleTranslate = async (msgId: string, content: string) => {
    // Zaten çevrildiyse geri al
    if (translations[msgId]) {
      const newTranslations = { ...translations };
      delete newTranslations[msgId];
      setTranslations(newTranslations);
      return;
    }

    setTranslatingIds((prev) => [...prev, msgId]);

    try {
      const translatedText = await translateText(content, lang);
      setTranslations((prev) => ({ ...prev, [msgId]: translatedText }));
    } catch (error) {
      console.error("Çeviri hatası:", error);
    } finally {
      setTranslatingIds((prev) => prev.filter((id) => id !== msgId));
    }
  };

  const formatTime = (dateInput: Date | string) => {
    try {
      return new Date(dateInput).toLocaleTimeString(
        lang === "en" ? "en-US" : "tr-TR",
        { hour: "2-digit", minute: "2-digit" },
      );
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden transition-colors duration-500 font-sans">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-purple-500/20 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-900/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      {/* HEADER */}
      <header className="absolute top-4 left-4 right-4 z-40">
        <div className="bg-white/70 dark:bg-[#0f172a]/60 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[24px] px-4 py-3 shadow-xl shadow-black/5 dark:shadow-black/20 flex items-center justify-between ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transition-transform group-hover:scale-105">
                <Globe
                  size={18}
                  className="animate-[spin_10s_linear_infinite]"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-[#0f172a] rounded-full animate-pulse"></span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight flex items-center gap-1.5">
                {t.globalChat}{" "}
                <Sparkles size={12} className="text-yellow-500" />
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Active Team Session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
              {messages.length}
            </div>
          </div>
        </div>
      </header>

      {/* CHAT AREA */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-28 pb-32 px-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent z-10"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            const showAvatar =
              !isMe &&
              (index === 0 || messages[index - 1].senderId !== msg.senderId);

            const isTranslated = !!translations[msg.id];
            const isTranslating = translatingIds.includes(msg.id);
            const displayedContent = isTranslated
              ? translations[msg.id]
              : msg.content;

            return (
              <motion.div
                layout
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`flex gap-3 ${isMe ? "justify-end" : "justify-start group"}`}
              >
                {!isMe && (
                  <div className="flex flex-col justify-end w-9 shrink-0 pb-1">
                    {showAvatar ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-9 h-9 relative rounded-full overflow-hidden shadow-md ring-2 ring-white dark:ring-[#1e293b]"
                      >
                        <Image
                          src={
                            msg.sender.imageUrl ||
                            `https://ui-avatars.com/api/?background=random&name=${msg.sender.name}`
                          }
                          alt="user"
                          fill
                          className="object-cover"
                        />
                      </motion.div>
                    ) : (
                      <div className="w-9" />
                    )}
                  </div>
                )}

                <div
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] sm:max-w-[65%]`}
                >
                  {!isMe && showAvatar && (
                    <div className="ml-3 mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                        {msg.sender.name}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {msg.sender.cultureContext || "Global"} /{" "}
                        {msg.sender.religion || "-"}
                      </span>
                    </div>
                  )}

                  <div
                    className={`
                    relative px-5 py-3 shadow-sm text-[14px] leading-relaxed break-words backdrop-blur-sm group/bubble
                    ${
                      isMe
                        ? "bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white rounded-[20px] rounded-tr-[4px] shadow-blue-500/20"
                        : "bg-white dark:bg-[#1e293b]/80 text-slate-800 dark:text-slate-100 rounded-[20px] rounded-tl-[4px] border border-slate-100 dark:border-slate-700/50 shadow-sm"
                    }
                  `}
                  >
                    {displayedContent}

                    <div
                      className={`flex items-center justify-end gap-2 mt-1.5 ${isMe ? "text-blue-100/70" : "text-slate-400"}`}
                    >
                      {!isMe && (
                        <button
                          onClick={() => handleTranslate(msg.id, msg.content)}
                          disabled={isTranslating}
                          className={`
                            opacity-0 group-hover/bubble:opacity-100 transition-opacity p-0.5 rounded
                            ${isTranslated ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 opacity-100" : "hover:bg-slate-100 dark:hover:bg-slate-700"}
                          `}
                          title="Translate"
                        >
                          {isTranslating ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Languages size={10} />
                          )}
                        </button>
                      )}

                      <span
                        className="text-[9px] font-medium tracking-wide"
                        suppressHydrationWarning
                      >
                        {formatTime(msg.createdAt)}
                      </span>
                      {isMe && <CheckCheck size={13} className="opacity-90" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* INPUT AREA */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-50">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-[435px] mx-auto"
        >
          <form
            ref={formRef}
            action={handleSendMessage}
            className="relative group bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-2xl p-1.5 rounded-[32px] shadow-2xl shadow-blue-900/10 dark:shadow-black/40 border border-white/40 dark:border-white/10 flex items-center gap-2 ring-1 ring-black/5 dark:ring-white/5 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:scale-[1.01]"
          >
            <div className="pl-4 flex-1">
              <input
                name="content"
                type="text"
                placeholder={t.typeMessage}
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-none text-[15px] py-3.5"
                autoComplete="off"
                disabled={isSending}
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-600/50 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:scale-100"
            >
              {isSending ? (
                <Loader2 size={20} className="animate-spin text-white/90" />
              ) : (
                <Send size={20} className="-ml-0.5 mt-0.5 text-white" />
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
