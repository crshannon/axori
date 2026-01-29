/**
 * Quiz Detail Page
 *
 * Take a specific quiz with interactive questions and immediate feedback.
 */

import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getQuizBySlug } from "@/data/learning-hub/quizzes";
import { Quiz } from "@/components/learning-hub/Quiz";
import { cn } from "@/utils/helpers";
import { useTheme } from "@/utils/providers/theme-provider";

export const Route = createFileRoute("/_authed/learning-hub/quizzes/$slug")({
  component: QuizDetailPage,
});

function QuizDetailPage() {
  const { slug } = useParams({ from: "/_authed/learning-hub/quizzes/$slug" });
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const quiz = getQuizBySlug(slug);

  if (!quiz) {
    return (
      <div className="p-6 xl:p-8">
        <Link
          to="/learning-hub/quizzes"
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium mb-6",
            isDark
              ? "text-white/60 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <ArrowLeft size={16} />
          Back to Quizzes
        </Link>

        <div
          className={cn(
            "p-12 rounded-2xl border text-center",
            isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
          )}
        >
          <p
            className={cn(
              "font-bold mb-2",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Quiz not found
          </p>
          <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-500")}>
            The quiz you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const handleQuizComplete = (result: {
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    answers: Record<string, string>;
  }) => {
    // Could save to API here using useSubmitQuizAttempt
    console.log("Quiz completed:", result);
  };

  return (
    <div className="p-6 xl:p-8">
      {/* Back Link */}
      <Link
        to="/learning-hub/quizzes"
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium mb-6",
          isDark
            ? "text-white/60 hover:text-white"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        <ArrowLeft size={16} />
        Back to Quizzes
      </Link>

      {/* Quiz Component */}
      <div className="max-w-2xl mx-auto">
        <Quiz quiz={quiz} isDark={isDark} onComplete={handleQuizComplete} />
      </div>
    </div>
  );
}
