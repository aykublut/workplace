"use server";

import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";
import { translate } from "google-translate-api-x";

const prisma = new PrismaClient();

// ------------------------------------------------------------------
// 1. ZAMAN HESAPLAMA MOTORU (VARŞOVA SAATİ)
// ------------------------------------------------------------------
function calculateCompanyStatus() {
  const now = new Date();

  // Varşova saat dilimine göre formatla
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Warsaw",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentTimeString = formatter.format(now); // Örn: "09:45"
  const [hourStr, minuteStr] = currentTimeString.split(":");
  const currentHour = parseInt(hourStr);
  const currentMinute = parseInt(minuteStr);

  // Hesaplama için ondalıklı saat (Örn: 09:30 -> 9.5)
  const currentTimeValue = currentHour + currentMinute / 60;

  // ŞİRKET TAKVİMİ
  const SCHEDULE = {
    START: 9, // 09:00
    LUNCH_START: 12, // 12:00
    LUNCH_END: 13, // 13:00
    END: 17, // 17:00
  };

  // Varsayılan Durum
  let status = {
    stateKey: "status_off", // Durum Başlığı (Mesai Dışı vs.)
    nextLabelKey: "next_event_start", // Alt Başlık (Mesai Başlangıcı vs.)
    nextTime: "09:00", // Hedef Saat
    currentTime: currentTimeString, // Canlı Saat
    color: "gray", // Kart Rengi
    progress: 0, // Bar Yüzdesi
  };

  // A) MESAİ ÖNCESİ (00:00 - 09:00)
  if (currentTimeValue < SCHEDULE.START) {
    status = {
      ...status,
      stateKey: "status_off",
      nextLabelKey: "next_event_start",
      nextTime: "09:00",
      color: "gray",
      progress: 0,
    };
  }
  // B) SABAH MESAİSİ (09:00 - 12:00) --> SENİN SORDUĞUN KISIM BURASI
  else if (
    currentTimeValue >= SCHEDULE.START &&
    currentTimeValue < SCHEDULE.LUNCH_START
  ) {
    const totalDuration = SCHEDULE.LUNCH_START - SCHEDULE.START;
    const elapsed = currentTimeValue - SCHEDULE.START;
    const percent = (elapsed / totalDuration) * 100;

    status = {
      ...status,
      stateKey: "status_working",
      nextLabelKey: "next_event_lunch", // <-- EKRANDA "Öğle Yemeği:" YAZACAK
      nextTime: "12:00", // <-- HEDEF SAAT 12:00 OLACAK
      color: "blue",
      progress: percent,
    };
  }
  // C) ÖĞLE MOLASI (12:00 - 13:00)
  else if (
    currentTimeValue >= SCHEDULE.LUNCH_START &&
    currentTimeValue < SCHEDULE.LUNCH_END
  ) {
    const totalDuration = SCHEDULE.LUNCH_END - SCHEDULE.LUNCH_START;
    const elapsed = currentTimeValue - SCHEDULE.LUNCH_START;
    const percent = (elapsed / totalDuration) * 100;

    status = {
      ...status,
      stateKey: "status_lunch",
      nextLabelKey: "next_event_back",
      nextTime: "13:00",
      color: "orange",
      progress: percent,
    };
  }
  // D) ÖĞLEDEN SONRA MESAİSİ (13:00 - 17:00)
  else if (
    currentTimeValue >= SCHEDULE.LUNCH_END &&
    currentTimeValue < SCHEDULE.END
  ) {
    const totalDuration = SCHEDULE.END - SCHEDULE.LUNCH_END;
    const elapsed = currentTimeValue - SCHEDULE.LUNCH_END;
    const percent = (elapsed / totalDuration) * 100;

    status = {
      ...status,
      stateKey: "status_working",
      nextLabelKey: "next_event_end",
      nextTime: "17:00",
      color: "green",
      progress: percent,
    };
  }
  // E) MESAİ SONRASI (17:00 - 23:59)
  else {
    status = {
      ...status,
      stateKey: "status_off",
      nextLabelKey: "next_event_start",
      nextTime: "09:00",
      color: "gray",
      progress: 100,
    };
  }

  // currentTime'ı her zaman güncel tut (hesaplamadan bağımsız)
  status.currentTime = currentTimeString;

  return status;
}

// ------------------------------------------------------------------
// 2. KİMLİK DOĞRULAMA & SYNC
// ------------------------------------------------------------------
async function getAuthenticatedUser() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Giriş yapılmamış!");
  }

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
      language: "tr",
    },
  });

  return dbUser;
}

// ------------------------------------------------------------------
// 3. PROFİL GÜNCELLEME
// ------------------------------------------------------------------
export async function updateProfileSettings(formData: FormData) {
  const language = formData.get("language") as string;
  const culture = formData.get("culture") as string;
  const religion = formData.get("religion") as string;

  const user = await getAuthenticatedUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { language, cultureContext: culture, religion },
  });

  revalidatePath("/", "layout");
}

// ------------------------------------------------------------------
// 4. DASHBOARD VERİSİ
// ------------------------------------------------------------------
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

  // HESAPLANMIŞ ŞİRKET DURUMUNU AL
  const companyStatus = calculateCompanyStatus();

  return {
    user,
    colleagues,
    messageCount,
    pendingTaskCount,
    companyStatus,
  };
}

// ------------------------------------------------------------------
// 5. YARDIMCI FONKSİYONLAR (QUIZ, TASK, MESAJLAR...)
// ------------------------------------------------------------------

export async function saveQuizResult(score: number, totalQuestions: number) {
  const user = await getAuthenticatedUser();
  await prisma.quizResult.create({
    data: { score, totalQuestions, userId: user.id },
  });
  revalidatePath("/learn");
}

export async function markMessagesAsRead() {
  const user = await getAuthenticatedUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastChatVisit: new Date() },
  });
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

export async function getMessages() {
  return await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          name: true,
          imageUrl: true,
          cultureContext: true,
          religion: true,
        },
      },
    },
    take: 50,
  });
}

export async function sendMessage(formData: FormData) {
  try {
    const user = await currentUser();
    if (!user || !user.id) return { success: false, error: "Unauthorized" };

    const content = formData.get("content") as string;
    if (!content) return { success: false };

    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId: user.id,
      },
      include: {
        sender: {
          select: {
            name: true,
            imageUrl: true,
            cultureContext: true,
            religion: true,
          },
        },
      },
    });

    await pusherServer.trigger("chat-channel", "new-message", newMessage);
    return { success: true };
  } catch (error) {
    console.error("sendMessage Error:", error);
    return { success: false, error: "Server Error" };
  }
}

export async function updateHeartbeat() {
  const { userId } = await auth();
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

export async function setUserStatus(formData: FormData) {
  const user = await getAuthenticatedUser();
  const statusType = formData.get("statusType") as string;
  const message = formData.get("message") as string;
  const duration = formData.get("duration") as string;

  let data: any = {};

  if (statusType === "CLEAR") {
    data = { customStatus: null, statusMessage: null, statusExpires: null };
  } else {
    const minutes = parseInt(duration) || 15;
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

export async function translateText(text: string, targetLang: string) {
  try {
    const res = await translate(text, {
      to: targetLang,
      autoCorrect: true,
    });
    return res.text;
  } catch (error) {
    return `${text} (Çeviri hatası)`;
  }
}
