"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Gamepad2, User } from "lucide-react";
import { clsx } from "clsx";

// Bu bileşen artık dışarıdan "labels" adında bir veri bekliyor
type BottomNavProps = {
  labels: {
    home: string;
    chat: string;
    learn: string;
    profile: string;
  };
};

export default function BottomNav({ labels }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: labels.home, href: "/", icon: Home },
    { name: labels.chat, href: "/communication", icon: MessageCircle },
    { name: labels.learn, href: "/learn", icon: Gamepad2 },
    { name: labels.profile, href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-4 pt-2 z-50">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href} // Key olarak href daha güvenli çünkü isim değişiyor
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-blue-600" : "text-gray-400",
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
