"use client";

import { useClerk } from "@clerk/nextjs";
import { Camera } from "lucide-react";

interface ProfileAvatarProps {
  imageUrl: string;
  name: string;
}

export function ProfileAvatar({ imageUrl, name }: ProfileAvatarProps) {
  const { openUserProfile } = useClerk();

  return (
    <div
      onClick={() => openUserProfile()}
      className="relative w-24 h-24 rounded-full group cursor-pointer overflow-hidden border-4 border-[var(--background)] shadow-lg transition-transform hover:scale-105"
    >
      {/* Profil Resmi */}
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
      />

      {/* Hover Durumunda Çıkan Kamera İkonu */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Camera className="text-white w-8 h-8" />
      </div>
    </div>
  );
}
