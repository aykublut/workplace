import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { dictionaries, Language } from "@/lib/data";
import { ThemeProvider } from "@/components/ThemeProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  title: "WorkPlace+",
  description: "Enterprise Team Management",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/thumbnail.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorkPlace+",
    startupImage: ["/thumbnail.jpg"],
  },
};

const prisma = new PrismaClient();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  let userLang: Language = "tr";

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { language: true },
    });
    if (dbUser?.language) {
      userLang = dbUser.language as Language;
    }
  }

  const t = dictionaries[userLang];

  const navLabels = {
    home: t.navHome,
    chat: t.navChat,
    learn: t.navLearn,
    profile: t.navProfile,
  };

  return (
    <ClerkProvider>
      {/* suppressHydrationWarning Next-themes için zorunludur */}
      <html lang="en" suppressHydrationWarning>
        <body
          // DÜZELTME: Hardcoded renkler (bg-[#...]) silindi.
          // Yerine 'bg-background text-foreground' kullanıldı.
          className={`${jakarta.className} antialiased bg-background text-foreground`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Mobil Kutu: bg-background ile sistem rengini otomatik alır */}
            <div className="max-w-[480px] mx-auto min-h-screen bg-background pb-16 relative shadow-2xl border-x border-border overflow-hidden transition-colors duration-300">
              {children}
              <BottomNav labels={navLabels} />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
