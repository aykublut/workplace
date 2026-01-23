"use client";

import { useState } from "react";
import { saveQuizResult } from "@/app/actions";
import { Question, dictionaries, Language } from "@/lib/data";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCcw,
  Trophy,
} from "lucide-react";
import { clsx } from "clsx";

export default function QuizEngine({
  questions,
  lang,
}: {
  questions: Question[];
  lang: Language;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Dil sözlüğünü seç
  const t = dictionaries[lang || "tr"];
  const currentQuestion = questions[currentIndex];

  const handleAnswer = (isCorrect: boolean, optionId: string) => {
    setSelectedOption(optionId);
    setIsAnswered(true);
    if (isCorrect) setScore((prev) => prev + 10);
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      await saveQuizResult(score, questions.length * 10);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  // SONUÇ EKRANI
  if (showResult) {
    return (
      <div className="bg-white dark:bg-[#0f172a] p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 text-center space-y-6 transition-colors">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="text-green-600 dark:text-green-400 w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.quizCompleted}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {t.totalScore}
          </p>
          <p className="text-5xl font-extrabold text-slate-900 dark:text-white mt-2">
            {score}
          </p>
        </div>
        <button
          onClick={restartQuiz}
          className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-slate-700 transition"
        >
          <RefreshCcw size={20} /> {t.playAgain}
        </button>
      </div>
    );
  }

  // SORU EKRANI
  return (
    <div className="bg-white dark:bg-[#0f172a] p-6 rounded-3xl shadow-lg border-t-4 border-purple-500 dark:border-purple-600 min-h-[400px] flex flex-col justify-between transition-colors">
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1 rounded-full uppercase">
            {t.question} {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
            {t.score}: {score}
          </span>
        </div>

        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-6 leading-snug">
          {currentQuestion.text}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt.isCorrect, opt.id)}
              disabled={isAnswered}
              className={clsx(
                "w-full p-4 text-left border-2 rounded-xl transition-all duration-200 relative",
                // CEVAPLANDIĞINDA
                isAnswered && opt.isCorrect
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50"
                  : "",
                isAnswered && !opt.isCorrect && selectedOption === opt.id
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500/50"
                  : "",
                // HENÜZ CEVAPLANMADIYSA
                !isAnswered
                  ? "border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  : "opacity-100",
              )}
            >
              <div className="flex justify-between items-center">
                <span
                  className={clsx(
                    "font-medium",
                    isAnswered && opt.isCorrect
                      ? "text-green-800 dark:text-green-400"
                      : "text-slate-700 dark:text-slate-300",
                    isAnswered &&
                      !opt.isCorrect &&
                      selectedOption === opt.id &&
                      "text-red-800 dark:text-red-400",
                  )}
                >
                  {opt.text}
                </span>
                {isAnswered && opt.isCorrect && (
                  <CheckCircle2 className="text-green-600 dark:text-green-400" />
                )}
                {isAnswered && !opt.isCorrect && selectedOption === opt.id && (
                  <XCircle className="text-red-600 dark:text-red-400" />
                )}
              </div>

              {/* Geri Bildirim */}
              {isAnswered && (selectedOption === opt.id || opt.isCorrect) && (
                <p
                  className={clsx(
                    "text-xs mt-2 font-semibold",
                    opt.isCorrect
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400",
                  )}
                >
                  {opt.feedback}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {isAnswered && (
        <button
          onClick={nextQuestion}
          className="mt-6 w-full py-4 bg-purple-600 dark:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 dark:hover:bg-purple-600 transition animate-in fade-in slide-in-from-bottom-2"
        >
          {t.nextQuestion} <ArrowRight size={20} />
        </button>
      )}
    </div>
  );
}
