import { getDashboardData, getMessages } from "@/app/actions";
import { dictionaries, Language } from "@/lib/data";
import ChatInterface from "@/components/ChatInterface"; // Yeni bileşeni çağır

// Sayfa yenilenmezse son mesajları göremezsin, bu yüzden dinamik yapıyoruz
export const dynamic = "force-dynamic";

export default async function CommunicationPage() {
  // Paralel veri çekme (Daha hızlı yüklenir)
  const [messages, data] = await Promise.all([
    getMessages(),
    getDashboardData(),
  ]);

  const user = data.user;
  const t = dictionaries[(user.language as Language) || "tr"];

  return (
    // Ekranın tamamını kaplasın (BottomNav hariç)
    <div className="h-[calc(100vh-65px)] overflow-hidden">
      <ChatInterface
        initialMessages={messages}
        currentUserId={user.id}
        lang={(user.language as Language) || "tr"}
      />
    </div>
  );
}
