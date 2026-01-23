"use server";

import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";
import { translate } from "google-translate-api-x";
const prisma = new PrismaClient();

// 1. KİMLİK DOĞRULAMA & SYNC
async function getAuthenticatedUser() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Giriş yapılmamış!");
  }

  // Kullanıcıyı veritabanıyla eşle
  const dbUser = await prisma.user.upsert({
    where: { id: userId },
    update: {
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
    },
    create: {
      id: userId,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
    },
  });

  return dbUser;
}

// 2. PROFİL GÜNCELLEME (Dil, Din, Kültür)
export async function updateProfileSettings(formData: FormData) {
  const language = formData.get("language") as string;
  const culture = formData.get("culture") as string;
  const religion = formData.get("religion") as string;

  const user = await getAuthenticatedUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { language, cultureContext: culture, religion },
  });

  // !!! KRİTİK: TÜM UYGULAMANIN DİLİNİ ANINDA YENİLE !!!
  revalidatePath("/", "layout");
}

// 3. DASHBOARD VERİSİ
export async function getDashboardData() {
  const user = await getAuthenticatedUser();

  const messageCount = await prisma.message.count({
    where: {
      senderId: { not: user.id },
      createdAt: { gt: user.lastChatVisit },
    },
  });

  const pendingTaskCount = await prisma.task.count({
    where: { userId: user.id, isCompleted: false },
  });

  const colleagues = await prisma.user.findMany({
    where: { id: { not: user.id } },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      lastActiveAt: true,
      customStatus: true,
      statusMessage: true,
      statusExpires: true,
      cultureContext: true,
      religion: true,
    },
    orderBy: { lastActiveAt: "desc" },
  });

  // --- ŞİRKET ZAMAN ALGORİTMASI (DÜZELTİLDİ: TimeZone Eklendi) ---
  const now = new Date();

  // Şirket Merkez Saati: Türkiye (veya 'Europe/Warsaw' yapabilirsin)
  const companyTimeString = now.toLocaleString("en-US", {
    timeZone: "Europe/Istanbul",
  });
  const companyTime = new Date(companyTimeString);

  const hour = companyTime.getHours();
  const minute = companyTime.getMinutes();
  const timeVal = hour + minute / 60; // Ondalık saat (örn: 09:30 -> 9.5)

  let companyStateKey = "status_off"; // Varsayılan: Kapalı
  let nextEventTime = "09:00";
  let nextEventLabelKey = "next_event_start";
  let shiftProgress = 0; // İlerleme çubuğu (%)
  let stateColor = "gray"; // UI rengi

  // 1. MESAİ ÖNCESİ (00:00 - 09:00)
  if (timeVal < 9) {
    companyStateKey = "status_off";
    nextEventTime = "09:00";
    nextEventLabelKey = "next_event_start"; // "Mesai Başlangıcı"
    shiftProgress = 0;
    stateColor = "gray";
  }
  // 2. SABAH MESAİSİ (09:00 - 12:00)
  else if (timeVal >= 9 && timeVal < 12) {
    companyStateKey = "status_working";
    nextEventTime = "12:00";
    nextEventLabelKey = "next_event_lunch"; // "Öğle Yemeği"
    shiftProgress = ((timeVal - 9) / 3) * 100;
    stateColor = "blue";
  }
  // 3. ÖĞLE ARASI (12:00 - 13:00)
  else if (timeVal >= 12 && timeVal < 13) {
    companyStateKey = "status_lunch";
    nextEventTime = "13:00";
    nextEventLabelKey = "next_event_back"; // "Dönüş"
    shiftProgress = ((timeVal - 12) / 1) * 100;
    stateColor = "orange";
  }
  // 4. ÖĞLEDEN SONRA MESAİSİ (13:00 - 17:00)
  else if (timeVal >= 13 && timeVal < 17) {
    companyStateKey = "status_working";
    nextEventTime = "17:00";
    nextEventLabelKey = "next_event_end"; // "Paydos"
    shiftProgress = ((timeVal - 13) / 4) * 100;
    stateColor = "green";
  }
  // 5. MESAİ SONRASI (17:00 - 23:59)
  else {
    companyStateKey = "status_off";
    nextEventTime = "09:00"; // Yarın sabah
    nextEventLabelKey = "next_event_start"; // "Mesai Başlangıcı"
    shiftProgress = 100;
    stateColor = "gray";
  }

  // Verileri paketle
  const companyStatus = {
    stateKey: companyStateKey,
    nextTime: nextEventTime,
    nextLabelKey: nextEventLabelKey,
    progress: Math.round(shiftProgress),
    color: stateColor,
  };

  return {
    messageCount,
    pendingTaskCount,
    nextBreak: nextEventTime,
    companyStatus,
    user,
    colleagues,
  };
}
// 4. QUIZ SONUCU KAYDETME
export async function saveQuizResult(score: number, totalQuestions: number) {
  const user = await getAuthenticatedUser();

  await prisma.quizResult.create({
    data: { score, totalQuestions, userId: user.id },
  });

  revalidatePath("/learn");
}
// 2. YENİ FONKSİYON: MESAJLARI OKUNDU İŞARETLE
export async function markMessagesAsRead() {
  const user = await getAuthenticatedUser();

  // Kullanıcının son sohbet ziyaretini "ŞU AN" olarak güncelle
  await prisma.user.update({
    where: { id: user.id },
    data: { lastChatVisit: new Date() },
  });

  // Dashboard'daki kırmızı bildirimi anında yok etmek için
  revalidatePath("/");
}

export async function getUserStats() {
  const user = await getAuthenticatedUser();
  const results = await prisma.quizResult.findMany({
    where: { userId: user.id },
  });

  const totalGames = results.length;
  const avgScore =
    totalGames > 0
      ? Math.round(
          results.reduce((acc, curr) => acc + curr.score, 0) / totalGames,
        )
      : 0;

  return { totalGames, avgScore };
}

// 5. GÖREVLER
export async function getTasks() {
  const user = await getAuthenticatedUser();
  return await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTask(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title.trim()) return;
  const user = await getAuthenticatedUser();
  await prisma.task.create({ data: { title, userId: user.id } });
  revalidatePath("/tasks");
}

export async function toggleTaskStatus(taskId: string, currentStatus: boolean) {
  const user = await getAuthenticatedUser();
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: { isCompleted: !currentStatus },
  });
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const user = await getAuthenticatedUser();
  await prisma.task.deleteMany({ where: { id: taskId, userId: user.id } });
  revalidatePath("/tasks");
}

// 6. MESAJLAR
export async function getMessages() {
  return await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          name: true,
          imageUrl: true,
          cultureContext: true, // Yeni
          religion: true, // Yeni
        },
      },
    },
    take: 50,
  });
}

export async function sendMessage(formData: FormData) {
  const user = await currentUser();
  if (!user) return;

  const content = formData.get("content") as string;
  if (!content) return;

  // 1. Veritabanına Kayıt
  const newMessage = await prisma.message.create({
    data: {
      content,
      senderId: user.id,
    },
    include: {
      sender: { select: { name: true, imageUrl: true } },
    },
  });

  // 2. REAL-TIME TETİKLEME (Burası Yeni) 🚀
  // "chat-channel" kanalındaki herkese "new-message" olayı gönder
  await pusherServer.trigger("chat-channel", "new-message", newMessage);

  return { success: true };
}
// 1. HEARTBEAT (Kullanıcı uygulamadaysa sürekli bunu çağıracağız)
export async function updateHeartbeat() {
  const { userId } = await auth();
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

// 2. DURUM AYARLAMA
export async function setUserStatus(formData: FormData) {
  const user = await getAuthenticatedUser();
  const statusType = formData.get("statusType") as string; // PRAYER, LUNCH, CUSTOM, CLEAR
  const message = formData.get("message") as string;
  const duration = formData.get("duration") as string; // Dakika cinsinden

  let data: any = {};

  if (statusType === "CLEAR") {
    // Durumu sıfırla (Working/On App moduna dön)
    data = { customStatus: null, statusMessage: null, statusExpires: null };
  } else {
    // Yeni durum ayarla
    const minutes = parseInt(duration) || 15; // Varsayılan 15 dk
    const expiresAt = new Date(Date.now() + minutes * 60000);

    data = {
      customStatus: statusType,
      statusMessage: message || null,
      statusExpires: expiresAt,
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: data,
  });

  revalidatePath("/");
}
// 7. GERÇEK ÇEVİRİ FONKSİYONU (Google Translate)
export async function translateText(text: string, targetLang: string) {
  try {
    // Google Translate API'sine istek atıyoruz (API Key gerektirmez)
    // autoCorrect: true -> Yazım hatalarını düzeltip çevirir.
    const res = await translate(text, {
      to: targetLang,
      autoCorrect: true,
    });

    // Çevrilen temiz metni döndür
    return res.text;
  } catch (error) {
    console.error("Çeviri Hatası:", error);
    // Eğer Google servisine ulaşılamazsa (Rate limit vb.), orijinal metni ve hata mesajı döndür
    return `${text} (Çeviri hatası)`;
  }
}
