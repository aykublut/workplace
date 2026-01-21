"use server";

import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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
    where: { senderId: { not: user.id } },
  });

  const pendingTaskCount = await prisma.task.count({
    where: { userId: user.id, isCompleted: false },
  });

  // Saat Mantığı
  const hour = new Date().getHours();
  let nextBreak = "09:00";
  if (hour < 12) nextBreak = "12:30";
  else if (hour < 15) nextBreak = "15:00";
  else if (hour < 18) nextBreak = "18:00";

  return { messageCount, pendingTaskCount, nextBreak, user };
}

// 4. QUIZ SONUCU KAYDETME
export async function saveQuizResult(score: number, totalQuestions: number) {
  const user = await getAuthenticatedUser();

  await prisma.quizResult.create({
    data: { score, totalQuestions, userId: user.id },
  });

  revalidatePath("/learn");
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
    include: { sender: true },
    take: 50,
  });
}

export async function sendMessage(formData: FormData) {
  const content = formData.get("content") as string;
  if (!content.trim()) return;
  const user = await getAuthenticatedUser();
  await prisma.message.create({ data: { content, senderId: user.id } });
  revalidatePath("/communication");
}
