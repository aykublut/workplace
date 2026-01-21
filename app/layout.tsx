import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { dictionaries, Language } from "@/lib/data";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WorkPlace+",
  description: "Enterprise Team Management",
};

const prisma = new PrismaClient();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Kullanıcıyı bul
  const user = await currentUser();
  let userLang: Language = "tr"; // Varsayılan dil

  // 2. Eğer giriş yapmışsa veritabanından dilini çek
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { language: true },
    });
    if (dbUser?.language) {
      userLang = dbUser.language as Language;
    }
  }

  // 3. O dilin sözlüğünü al
  const t = dictionaries[userLang];

  // 4. Sadece menü için gerekli kelimeleri paketle
  const navLabels = {
    home: t.navHome,
    chat: t.navChat,
    learn: t.navLearn,
    profile: t.navProfile,
  };

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${jakarta.className} antialiased bg-[#F1F5F9] text-slate-900`}
        >
          <div className="max-w-[480px] mx-auto min-h-screen bg-white pb-24 relative shadow-2xl border-x border-gray-100 overflow-hidden">
            {children}

            {/* 5. Kelimeleri Props olarak gönder */}
            <BottomNav labels={navLabels} />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
