import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { dictionaries, Language } from "@/lib/data";
// YENİ: ThemeProvider eklendi
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
  themeColor: "#020617", // Dark moda uygun renk
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
    apple: "/cover.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorkPlace+",
    startupImage: ["/cover.jpg"],
  },
  openGraph: {
    title: "WorkPlace+ 🚀",
    description: "Takım yönetimi ve kültür simülasyonu uygulaması.",
    url: "/",
    siteName: "WorkPlace+",
    locale: "tr_TR",
    type: "website",
    images: [
      { url: "/cover.jpg", width: 1200, height: 630, alt: "WorkPlace+" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkPlace+ 🚀",
    description: "Enterprise Team Management App",
    images: ["/cover.jpg"],
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
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${jakarta.className} antialiased bg-[#F1F5F9] dark:bg-[#020617] text-slate-900 dark:text-slate-50`}
        >
          {/* ThemeProvider ile sarmaladık */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Mobil Kutu: Arka plan rengini değişkene (bg-background) bağladık */}
            <div className="max-w-[480px] mx-auto min-h-screen bg-[var(--background)] pb-24 relative shadow-2xl border-x border-[var(--border)] overflow-hidden transition-colors duration-300">
              {children}
              <BottomNav labels={navLabels} />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
