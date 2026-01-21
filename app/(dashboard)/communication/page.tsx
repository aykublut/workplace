import { Send, Globe } from "lucide-react";
import { getDashboardData, getMessages, sendMessage } from "@/app/actions";
import Image from "next/image";
import { dictionaries, Language } from "@/lib/data";

export default async function CommunicationPage() {
  const messages = await getMessages();
  const data = await getDashboardData();
  const user = data.user;
  const t = dictionaries[(user.language as Language) || "tr"];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50">
      <header className="bg-white p-4 shadow-sm flex items-center gap-2 sticky top-0 z-10">
        <Globe className="text-blue-600" />
        <h1 className="font-bold">{t.globalChat}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
            >
              <div className="w-8 h-8 relative rounded-full overflow-hidden border border-gray-200 shrink-0">
                {msg.sender.imageUrl ? (
                  <Image
                    src={msg.sender.imageUrl}
                    alt="user"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300" />
                )}
              </div>
              <div
                className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-gray-400 mb-1 ml-1">
                  {msg.sender.name}
                </span>
                <div
                  className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border rounded-tl-none text-gray-800"}`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-white border-t fixed bottom-16 w-full max-w-[480px]">
        <form action={sendMessage} className="flex gap-2">
          <input
            name="content"
            type="text"
            placeholder={t.typeMessage}
            className="flex-1 p-3 bg-gray-100 rounded-xl outline-none"
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-xl"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
