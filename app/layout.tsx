import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
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

// --- 1. MOBİL GÖRÜNÜM (APP HİSSİ) ---
// Zoom yapılmasını engeller, tam ekran hissi verir.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

// --- 2. METADATA & İKONLAR ---
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  title: "WorkPlace+",
  description: "Enterprise Team Management",
  manifest: "/manifest.json",

  // İkon Ayarları (Favicon ve App İkonu)
  icons: {
    icon: "/favicon.ico", // Tarayıcı sekmesindeki küçük ikon
    shortcut: "/favicon.ico",
    apple: "/thumbnail.png", // iPhone ana ekran ikonu (Yüksek kalite)
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/thumbnail.png",
    },
  },

  // Apple / iOS Özel Ayarları
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorkPlace+",
    startupImage: ["/thumbnail.png"],
  },

  // Telefon numaralarını otomatik link yapmayı engelle
  formatDetection: {
    telephone: false,
  },

  // Sosyal Medya Paylaşımı (WhatsApp, Twitter, LinkedIn)
  openGraph: {
    title: "WorkPlace+ 🚀",
    description: "Takım yönetimi ve kültür simülasyonu uygulaması.",
    url: "/",
    siteName: "WorkPlace+",
    images: [
      {
        url: "/thumbnail.png", // Paylaşılınca çıkacak büyük resim
        width: 1200,
        height: 630,
        alt: "WorkPlace+ Uygulama Önizlemesi",
      },
    ],
    locale: "tr_TR",
    type: "website",
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
      <html lang="en">
        <body
          className={`${jakarta.className} antialiased bg-[#F1F5F9] text-slate-900`}
        >
          <div className="max-w-[480px] mx-auto min-h-screen bg-white pb-24 relative shadow-2xl border-x border-gray-100 overflow-hidden">
            {children}
            <BottomNav labels={navLabels} />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
