import { Gamepad2, Trophy } from "lucide-react";

// 'quizzes' objesini çekiyoruz, tek bir 'questions' dizisini değil
import { dictionaries, Language, quizzes } from "@/lib/data";
import { getDashboardData, getUserStats } from "@/app/actions";
import QuizEngine from "./QuizEngine";

export default async function LearnPage() {
  const stats = await getUserStats();
  const data = await getDashboardData();

  // Kullanıcının dili neyse (tr, en, es, fr) onu alıyoruz
  const currentLang = (data.user.language as Language) || "tr";

  // UI metinleri için sözlük
  const t = dictionaries[currentLang];

  // !!! KRİTİK NOKTA: Soruları dile göre seçiyoruz !!!
  const questions = quizzes[currentLang];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Gamepad2 className="text-purple-600" /> {t.quizTitle}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t.quizDesc}</p>
      </header>

      {/* İstatistik Kartı */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
            {t.generalPerformance}
          </p>
          <div className="flex gap-6 mt-2">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">
                {stats.totalGames}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">
                {t.game}
              </span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-green-600">
                {stats.avgScore}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">
                {t.avgScore}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-2xl">
          <Trophy className="text-purple-600 w-8 h-8" />
        </div>
      </div>

      {/* Dinamik Dilli Soruları Motora Gönderiyoruz */}
      <QuizEngine questions={questions} lang={currentLang} />
    </div>
  );
}
