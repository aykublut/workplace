import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public (Giriş yapmadan erişilebilen) rotalar
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Eğer sayfa "Public" değilse
  if (!isPublicRoute(request)) {
    // 1. auth() fonksiyonunu bekle ve nesneyi al
    const authObject = await auth();

    // 2. userId var mı diye bak (Manuel Koruma)
    if (!authObject.userId) {
      // 3. Yoksa giriş sayfasına yönlendir
      return authObject.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    // Next.js iç dosyaları hariç her şeyi yakala
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API rotalarını her zaman yakala
    "/(api|trpc)(.*)",
  ],
};
