"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Gamepad2, User } from "lucide-react";
import { clsx } from "clsx";

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
    // bg-white yerine bg-[var(--card)] ve border-t border-[var(--border)] yaptık
    <nav className="fixed bottom-0 left-0 w-full bg-[var(--card)] border-t border-[var(--border)] pb-4 pt-2 z-50 transition-colors duration-300">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full",
                // Aktif renk mavi, pasif renk muted-foreground (gri)
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-[var(--muted-foreground)]",
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
