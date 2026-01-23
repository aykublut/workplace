import { Gamepad2, Trophy } from "lucide-react";
import { dictionaries, Language, quizzes } from "@/lib/data";
import { getDashboardData, getUserStats } from "@/app/actions";
import QuizEngine from "./QuizEngine";

export default async function LearnPage() {
  const stats = await getUserStats();
  const data = await getDashboardData();

  const currentLang = (data.user.language as Language) || "tr";
  const t = dictionaries[currentLang];
  const questions = quizzes[currentLang];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300 pb-24 p-6 space-y-6 font-sans">
      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Gamepad2 className="text-purple-600 dark:text-purple-400" />
          {t.quizTitle}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {t.quizDesc}
        </p>
      </header>

      {/* İSTATİSTİK KARTI */}
      <div className="bg-white dark:bg-[#0f172a] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            {t.generalPerformance}
          </p>
          <div className="flex gap-6 mt-2">
            {/* Toplam Oyun */}
            <div>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.totalGames}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">
                {t.game}
              </span>
            </div>

            {/* Ortalama Puan */}
            <div>
              <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                {stats.avgScore}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">
                {t.avgScore}
              </span>
            </div>
          </div>
        </div>

        {/* Kupa İkonu */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-500/20">
          <Trophy className="text-purple-600 dark:text-purple-400 w-8 h-8" />
        </div>
      </div>

      {/* QUIZ ENGINE (Sorular) */}
      {/* Not: QuizEngine bileşeninin içini de (varsa) benzer şekilde dark moda uyumlu hale getirdiğinden emin ol */}
      <QuizEngine questions={questions} lang={currentLang} />
    </div>
  );
}
