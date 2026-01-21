import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Giriş yapmadan erişilebilecek sayfalar (Sadece giriş ekranları)
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Eğer sayfa "Public" değilse, kullanıcıyı koru (Login'e zorla)
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

// Senin gönderdiğin güncel Config ayarı (Aynen koruyoruz)
export const config = {
  matcher: [
    // Next.js internals ve statik dosyaları atla
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API rotaları için her zaman çalıştır
    "/(api|trpc)(.*)",
  ],
};
