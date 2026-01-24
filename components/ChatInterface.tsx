"use client";

import { useRef, useEffect, useState } from "react";
import {
  Send,
  Globe,
  CheckCheck,
  Loader2,
  Sparkles,
  Languages,
  Mic,
  Square,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { markMessagesAsRead, sendMessage, translateText } from "@/app/actions";
import { dictionaries, Language } from "@/lib/data";
import { pusherClient } from "@/lib/pusher";
import { motion, AnimatePresence } from "framer-motion";

// TİP TANIMI GÜNCELLENDİ
type Message = {
  id: string;
  content: string;
  audioUrl?: string | null; // <-- YENİ
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

  // --- SES KAYIT STATE'LERİ ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 2. REAL-TIME
  useEffect(() => {
    const channel = pusherClient.subscribe("chat-channel");

    channel.bind("new-message", (data: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        if (data.senderId === currentUserId) {
          const optimisticMatch = prev.find(
            (m) =>
              m.id.startsWith("temp-") &&
              (m.content === data.content || (m.audioUrl && data.audioUrl)),
          );
          if (optimisticMatch) {
            return prev.map((m) => (m.id === optimisticMatch.id ? data : m));
          }
        }
        return [...prev, data];
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUserId]);

  // --- KAYIT FONKSİYONLARI ---
  // KAYDI BAŞLATAN ANA FONKSİYON
  const startRecording = async () => {
    try {
      // 1. Tarayıcıdan Mikrofon İzni İste (Bu satır standart 'İzin Ver' kutusunu açar)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Kullanıcı izin verirse Recorder'ı ayarla
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      // Veri geldikçe parçaları topla
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // Kayıt durduğunda yapılacak işlemler
      mediaRecorder.onstop = () => {
        // Toplanan parçalardan ses dosyasını (Blob) oluştur
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);

        // ÖNEMLİ: Mikrofonu tamamen serbest bırak (Tarayıcıdaki kırmızı kayıt ikonu söner)
        stream.getTracks().forEach((track) => track.stop());
      };

      // 3. Kaydı ve Zamanlayıcıyı Başlat
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // UI için saniye sayacı
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      // 4. Hata ve Reddetme Yönetimi
      console.error("Mikrofon hatası:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        alert(
          "Mikrofon erişimi engellendi. Ayarlardan izin vermeniz gerekiyor.",
        );
      } else {
        alert(
          "Ses kaydedici başlatılamadı. Cihazınızda mikrofon olduğundan emin olun.",
        );
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 3. GÖNDERME
  async function handleSendMessage(formData: FormData) {
    const content = (formData.get("content") as string) || "";

    // Ne yazı ne ses varsa dur
    if (!content.trim() && !audioBlob) return;

    setIsSending(true);

    // Eğer ses varsa form'a ekle
    if (audioBlob) {
      formData.append("audio", audioBlob, "voice-note.webm");
    }

    formRef.current?.reset();

    // State temizliği
    const hasAudio = !!audioBlob;
    setAudioBlob(null);
    setRecordingTime(0);

    // Optimistic Message (Hızlıca ekrana düşmesi için)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: content,
      audioUrl: hasAudio ? "blob:optimistic-audio" : null, // Geçici placeholder
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

  // 4. ÇEVİRİ
  const handleTranslate = async (msgId: string, content: string) => {
    if (!content) return; // Sesli mesajın metni yoksa çevirme
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
      console.error("Error:", error);
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
      {/* BACKGROUND (Değişmedi) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-purple-500/20 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-900/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      {/* HEADER (Değişmedi) */}
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
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[70%]`}
                >
                  {!isMe && showAvatar && (
                    <div className="ml-3 mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                        {msg.sender.name}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {msg.sender.cultureContext || "Global"}
                      </span>
                    </div>
                  )}

                  <div
                    className={`
                    relative px-4 py-3 shadow-sm text-[14px] leading-relaxed break-words backdrop-blur-sm group/bubble
                    ${
                      isMe
                        ? "bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white rounded-[20px] rounded-tr-[4px] shadow-blue-500/20"
                        : "bg-white dark:bg-[#1e293b]/80 text-slate-800 dark:text-slate-100 rounded-[20px] rounded-tl-[4px] border border-slate-100 dark:border-slate-700/50 shadow-sm"
                    }
                  `}
                  >
                    {/* YAZI VARSA GÖSTER */}
                    {displayedContent && (
                      <p className="mb-1">{displayedContent}</p>
                    )}

                    {/* SES VARSA OYNATICI GÖSTER */}
                    {msg.audioUrl && (
                      <div className="mt-1 mb-2">
                        {msg.audioUrl === "blob:optimistic-audio" ? (
                          <div className="flex items-center gap-2 text-xs opacity-70 italic">
                            <Loader2 size={12} className="animate-spin" /> Ses
                            gönderiliyor...
                          </div>
                        ) : (
                          <audio
                            controls
                            src={msg.audioUrl}
                            className="h-8 w-[200px] max-w-full rounded-md"
                            style={{
                              filter: isMe ? "invert(1) brightness(2)" : "none",
                            }} // Mavi üzerindeyse renkleri uydur
                          />
                        )}
                      </div>
                    )}

                    <div
                      className={`flex flex-wrap items-center justify-end gap-3 mt-1 ${isMe ? "text-blue-100/70" : "text-slate-400"}`}
                    >
                      {/* ÇEVİRİ BUTONU (Sadece yazı varsa ve ben değilsem) */}
                      {!isMe && msg.content && (
                        <button
                          onClick={() => handleTranslate(msg.id, msg.content)}
                          disabled={isTranslating}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all active:scale-95 ${isTranslated ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400"}`}
                        >
                          {isTranslating ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Languages size={13} />
                          )}
                          <span className="text-[10px] font-semibold tracking-wide">
                            {isTranslating
                              ? "..."
                              : isTranslated
                                ? t.seeOriginal || "Orijinal"
                                : t.seeTranslation || "Çevir"}
                          </span>
                        </button>
                      )}

                      <span
                        className="text-[9px] font-medium tracking-wide opacity-80"
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

      {/* INPUT AREA (MODERN & GELİŞMİŞ) */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-50">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-[435px] mx-auto"
        >
          <form
            ref={formRef}
            action={handleSendMessage}
            className={`
              relative group backdrop-blur-2xl p-1.5 rounded-[32px] shadow-2xl shadow-blue-900/10 dark:shadow-black/40 border transition-all duration-300
              ${
                isRecording
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 ring-2 ring-red-500/20"
                  : "bg-white/80 dark:bg-[#0f172a]/80 border-white/40 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5 focus-within:ring-2 focus-within:ring-blue-500/50"
              }
              flex items-center gap-2
            `}
          >
            {/* INPUT KISMI - KAYIT MODUNDA DEĞİŞİR */}
            <div className="pl-4 flex-1">
              {isRecording || audioBlob ? (
                <div className="flex items-center gap-3 h-[46px]">
                  {isRecording ? (
                    <div className="flex items-center gap-3 animate-pulse">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      <span className="text-red-600 dark:text-red-400 font-mono font-bold text-lg tracking-widest">
                        {formatDuration(recordingTime)}
                      </span>
                      <span className="text-xs text-red-400 dark:text-red-300 font-medium ml-1">
                        Kaydediliyor...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                      <CheckCheck size={14} strokeWidth={3} />
                      <span className="text-xs font-bold">Ses Kaydedildi</span>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  name="content"
                  type="text"
                  placeholder={t.typeMessage}
                  className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-none text-[15px] py-3.5 h-[46px]"
                  autoComplete="off"
                  disabled={isSending}
                />
              )}
            </div>

            {/* BUTONLAR KISMI */}
            <div className="flex items-center gap-1 pr-1">
              {/* İPTAL BUTONU (Kayıt varsa) */}
              {(isRecording || audioBlob) && (
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
                  title="İptal Et"
                >
                  <Trash2 size={20} />
                </button>
              )}

              {/* MİKROFON BUTONU (Yazı yoksa ve kayıt yoksa) */}
              {!isRecording && !audioBlob && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-90 active:bg-blue-100"
                  title="Ses Kaydet"
                >
                  <Mic size={22} />
                </button>
              )}

              {/* DURDUR BUTONU (Kayıt sırasındaysa) */}
              {isRecording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-90 animate-in zoom-in"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              )}

              {/* GÖNDER BUTONU (Kayıt yoksa veya Kayıt bitmişse) */}
              {!isRecording && (
                <button
                  type="submit"
                  disabled={isSending}
                  className={`
                    w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:scale-100
                    ${
                      audioBlob
                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 text-white" // Ses varsa Yeşil buton
                        : "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:shadow-blue-600/50 text-white shadow-blue-600/30"
                    }
                  `}
                >
                  {isSending ? (
                    <Loader2 size={20} className="animate-spin text-white/90" />
                  ) : (
                    <Send
                      size={20}
                      className={`-ml-0.5 mt-0.5 ${audioBlob ? "ml-0" : ""}`}
                    />
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
