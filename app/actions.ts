"use server";

import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";
import { translate } from "google-translate-api-x";

const prisma = new PrismaClient();

// 1. KİMLİK DOĞRULAMA & SYNC
async function getAuthenticatedUser() {
  // DÜZELTME BURADA: auth() başına 'await' eklendi
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

// 2. PROFİL GÜNCELLEME
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

  // Şirket Zamanı
  const now = new Date();
  const companyTimeString = now.toLocaleString("en-US", {
    timeZone: "Europe/Istanbul",
  });
  const companyTime = new Date(companyTimeString);

  const hour = companyTime.getHours();
  const minute = companyTime.getMinutes();
  const timeVal = hour + minute / 60;

  let companyStateKey = "status_off";
  let nextEventTime = "09:00";
  let nextEventLabelKey = "next_event_start";
  let shiftProgress = 0;
  let stateColor = "gray";

  if (timeVal < 9) {
    companyStateKey = "status_off";
    nextEventTime = "09:00";
    nextEventLabelKey = "next_event_start";
    shiftProgress = 0;
    stateColor = "gray";
  } else if (timeVal >= 9 && timeVal < 12) {
    companyStateKey = "status_working";
    nextEventTime = "12:00";
    nextEventLabelKey = "next_event_lunch";
    shiftProgress = ((timeVal - 9) / 3) * 100;
    stateColor = "blue";
  } else if (timeVal >= 12 && timeVal < 13) {
    companyStateKey = "status_lunch";
    nextEventTime = "13:00";
    nextEventLabelKey = "next_event_back";
    shiftProgress = ((timeVal - 12) / 1) * 100;
    stateColor = "orange";
  } else if (timeVal >= 13 && timeVal < 17) {
    companyStateKey = "status_working";
    nextEventTime = "17:00";
    nextEventLabelKey = "next_event_end";
    shiftProgress = ((timeVal - 13) / 4) * 100;
    stateColor = "green";
  } else {
    companyStateKey = "status_off";
    nextEventTime = "09:00";
    nextEventLabelKey = "next_event_start";
    shiftProgress = 100;
    stateColor = "gray";
  }

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

// 4. QUIZ SONUCU
export async function saveQuizResult(score: number, totalQuestions: number) {
  const user = await getAuthenticatedUser();
  await prisma.quizResult.create({
    data: { score, totalQuestions, userId: user.id },
  });
  revalidatePath("/learn");
}

// 5. MESAJ OKUNDU
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

// 6. GÖREVLER
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

// 7. MESAJLAR (GET)
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

// 8. MESAJ GÖNDERME
export async function sendMessage(formData: FormData) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      console.error("HATA: Kullanıcı kimliği doğrulanamadı.");
      return { success: false, error: "Unauthorized" };
    }

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
    console.error("SUNUCU HATASI (sendMessage):", error);
    return { success: false, error: "Server Error" };
  }
}

// 9. HEARTBEAT
export async function updateHeartbeat() {
  // DÜZELTME BURADA: auth() başına 'await' eklendi
  const { userId } = await auth();
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

// 10. DURUM AYARLAMA
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

// 11. ÇEVİRİ
export async function translateText(text: string, targetLang: string) {
  try {
    const res = await translate(text, {
      to: targetLang,
      autoCorrect: true,
    });
    return res.text;
  } catch (error) {
    console.error("Çeviri Hatası:", error);
    return `${text} (Çeviri hatası)`;
  }
}
