"use client";

import { useUser } from "@clerk/nextjs";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export const ProfileImageUploader = ({ children }: Props) => {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 1. Kamera ikonuna basınca gizli input'u tetikle
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // 2. Dosya seçilince Clerk API'sine DOĞRUDAN gönder
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);

      // CLERK'İN HAZIR PENCERESİNİ AÇMIYORUZ.
      // DOSYAYI ELİMİZLE GÖNDERİYORUZ:
      await user.setProfileImage({ file });

      // Sayfayı yenile ki yeni resim görünsün
      router.refresh();
    } catch (error) {
      console.error("Resim yüklenirken hata oluştu:", error);
      alert("Resim yüklenemedi. Lütfen tekrar dene.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Gizli Dosya Seçici */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg, image/webp"
      />

      {/* Tıklanabilir Alan */}
      <div
        onClick={handleClick}
        className={`relative cursor-pointer group ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {children}

        {/* Kamera İkonu veya Loading */}
        <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-4 border-white dark:border-[#1e293b] shadow-sm z-10 transition-transform active:scale-95">
          {isUploading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Masaüstü Hover Efekti */}
        <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-8 h-8 text-white drop-shadow-md" />
        </div>
      </div>
    </div>
  );
};
