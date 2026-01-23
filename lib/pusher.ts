import PusherServer from "pusher";
import PusherClient from "pusher-js";

// --- 1. SERVER TARAFI (Backend işlemleri için) ---
// Mesajları göndermek için kullanılır.
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!, // Dikkat: Public Key
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!, // Dikkat: Public Cluster
  useTLS: true,
});

// --- 2. CLIENT TARAFI (Frontend dinlemeleri için) ---
// Mesajları anlık almak için kullanılır.
// Singleton Pattern: Sayfa yenilenmediği sürece aynı bağlantıyı kullanır.

// TypeScript için global değişken tanımı (Hata vermemesi için)
declare global {
  var pusherClient: PusherClient | undefined;
}

export const pusherClient =
  global.pusherClient ||
  new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

// Development modunda hot-reload yapıldığında sürekli yeni bağlantı açmasın diye:
if (process.env.NODE_ENV !== "production") {
  global.pusherClient = pusherClient;
}
