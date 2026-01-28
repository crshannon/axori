/**
 * Quiz Component
 *
 * Interactive quiz for testing knowledge with immediate feedback.
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trophy,
  XCircle,
} from "lucide-react";
import type { QuizQuestion, Quiz as QuizType } from "@/data/learning-hub/quizzes";
import { calculateQuizScore } from "@/data/learning-hub/quizzes";
import { cn } from "@/utils/helpers";

interface QuizProps {
  quiz: QuizType;
  isDark?: boolean;
  onComplete?: (result: {
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    answers: Record<string, string>;
  }) => void;
}

type QuizState = "intro" | "question" | "result";

export function Quiz({ quiz, isDark = false, onComplete }: QuizProps) {
  const [state, setState] = useState<QuizState>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isAnswered = selectedOption !== null;
  const isCorrect = isAnswered && selectedOption === currentQuestion.correctOptionId;

  const result = useMemo(() => {
    if (state !== "result") return null;
    return calculateQuizScore(quiz, answers);
  }, [quiz, answers, state]);

  const handleSelectOption = (optionId: string) => {
    if (showExplanation) return; // Already answered
    setSelectedOption(optionId);
    setShowExplanation(true);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate final result
      const finalResult = calculateQuizScore(quiz, {
        ...answers,
        [currentQuestion.id]: selectedOption!,
      });
      onComplete?.(finalResult);
      setState("result");
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      const prevQuestion = quiz.questions[currentQuestionIndex - 1];
      setSelectedOption(answers[prevQuestion.id] || null);
      setShowExplanation(!!answers[prevQuestion.id]);
    }
  };

  const handleRestart = () => {
    setState("intro");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedOption(null);
    setShowExplanation(false);
  };

  // Intro Screen
  if (state === "intro") {
    return (
      <div
        className={cn(
          "rounded-2xl border p-8 text-center",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )}
      >
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
            isDark ? "bg-[#E8FF4D]/20 text-[#E8FF4D]" : "bg-violet-100 text-violet-600"
          )}
        >
          <BookOpen size={32} />
        </div>

        <h2
          className={cn(
            "text-2xl font-black mb-2",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          {quiz.title}
        </h2>

        <p
          className={cn(
            "text-sm mb-6 max-w-md mx-auto",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          {quiz.description}
        </p>

        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="text-center">
            <div
              className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {quiz.questions.length}
            </div>
            <div
              className={cn(
                "text-xs uppercase tracking-wider",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              Questions
            </div>
          </div>
          <div
            className={cn(
              "w-px h-8",
              isDark ? "bg-white/10" : "bg-slate-200"
            )}
          />
          <div className="text-center">
            <div
              className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {quiz.estimatedMinutes}
            </div>
            <div
              className={cn(
                "text-xs uppercase tracking-wider",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              Minutes
            </div>
          </div>
          <div
            className={cn(
              "w-px h-8",
              isDark ? "bg-white/10" : "bg-slate-200"
            )}
          />
          <div className="text-center">
            <div
              className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {quiz.passingScore}%
            </div>
            <div
              className={cn(
                "text-xs uppercase tracking-wider",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              To Pass
            </div>
          </div>
        </div>

        <button
          onClick={() => setState("question")}
          className={cn(
            "px-8 py-3 rounded-full font-bold text-sm transition-colors",
            isDark
              ? "bg-[#E8FF4D] text-black hover:bg-[#d4eb45]"
              : "bg-violet-600 text-white hover:bg-violet-700"
          )}
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // Result Screen
  if (state === "result" && result) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-8 text-center",
          isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )}
      >
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
            result.passed
              ? isDark
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-emerald-100 text-emerald-600"
              : isDark
                ? "bg-amber-500/20 text-amber-400"
                : "bg-amber-100 text-amber-600"
          )}
        >
          {result.passed ? (
            <Trophy size={40} />
          ) : (
            <RefreshCw size={40} />
          )}
        </div>

        <h2
          className={cn(
            "text-2xl font-black mb-2",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          {result.passed ? "Congratulations!" : "Keep Learning!"}
        </h2>

        <p
          className={cn(
            "text-sm mb-6",
            isDark ? "text-white/60" : "text-slate-500"
          )}
        >
          {result.passed
            ? "You've passed this quiz and demonstrated your knowledge."
            : `You need ${quiz.passingScore}% to pass. Review the material and try again!`}
        </p>

        <div
          className={cn(
            "inline-flex items-center gap-4 p-4 rounded-2xl mb-8",
            isDark ? "bg-white/5" : "bg-slate-50"
          )}
        >
          <div className="text-center">
            <div
              className={cn(
                "text-4xl font-black",
                result.passed
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-600"
                  : isDark
                    ? "text-amber-400"
                    : "text-amber-600"
              )}
            >
              {Math.round(result.percentage)}%
            </div>
            <div
              className={cn(
                "text-xs uppercase tracking-wider",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              Your Score
            </div>
          </div>
          <div
            className={cn(
              "w-px h-12",
              isDark ? "bg-white/10" : "bg-slate-200"
            )}
          />
          <div className="text-center">
            <div
              className={cn(
                "text-4xl font-black",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {result.score}/{result.maxScore}
            </div>
            <div
              className={cn(
                "text-xs uppercase tracking-wider",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            >
              Correct
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleRestart}
            className={cn(
              "px-6 py-2.5 rounded-full font-bold text-sm transition-colors",
              isDark
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            Try Again
          </button>
          {quiz.relatedPathSlug && (
            <Link
              to="/learning-hub/paths/$slug"
              params={{ slug: quiz.relatedPathSlug }}
              className={cn(
                "px-6 py-2.5 rounded-full font-bold text-sm transition-colors",
                isDark
                  ? "bg-[#E8FF4D] text-black hover:bg-[#d4eb45]"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              )}
            >
              Review Material
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Question Screen
  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
      )}
    >
      {/* Progress Bar */}
      <div className={cn("h-1", isDark ? "bg-white/10" : "bg-slate-100")}>
        <div
          className={cn(
            "h-full transition-all duration-300",
            isDark ? "bg-[#E8FF4D]" : "bg-violet-600"
          )}
          style={{
            width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="p-6">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-6">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              isDark ? "text-white/40" : "text-slate-400"
            )}
          >
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
              isDark ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"
            )}
          >
            {quiz.level}
          </span>
        </div>

        {/* Question */}
        <h3
          className={cn(
            "text-lg font-bold mb-6",
            isDark ? "text-white" : "text-slate-900"
          )}
        >
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const isCorrectOption = option.id === currentQuestion.correctOptionId;
            const showResult = showExplanation;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={showExplanation}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                  showResult
                    ? isCorrectOption
                      ? isDark
                        ? "bg-emerald-500/20 border-emerald-500/50"
                        : "bg-emerald-50 border-emerald-300"
                      : isSelected
                        ? isDark
                          ? "bg-red-500/20 border-red-500/50"
                          : "bg-red-50 border-red-300"
                        : isDark
                          ? "bg-white/5 border-white/10 opacity-50"
                          : "bg-slate-50 border-slate-200 opacity-50"
                    : isSelected
                      ? isDark
                        ? "bg-[#E8FF4D]/20 border-[#E8FF4D]/50"
                        : "bg-violet-50 border-violet-300"
                      : isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10"
                        : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                    showResult
                      ? isCorrectOption
                        ? isDark
                          ? "bg-emerald-500/30 text-emerald-400"
                          : "bg-emerald-100 text-emerald-700"
                        : isSelected
                          ? isDark
                            ? "bg-red-500/30 text-red-400"
                            : "bg-red-100 text-red-700"
                          : isDark
                            ? "bg-white/10 text-white/40"
                            : "bg-slate-100 text-slate-400"
                      : isSelected
                        ? isDark
                          ? "bg-[#E8FF4D]/30 text-[#E8FF4D]"
                          : "bg-violet-100 text-violet-700"
                        : isDark
                          ? "bg-white/10 text-white/60"
                          : "bg-slate-100 text-slate-600"
                  )}
                >
                  {option.id.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "flex-grow",
                    showResult
                      ? isCorrectOption
                        ? isDark
                          ? "text-emerald-400"
                          : "text-emerald-700"
                        : isSelected
                          ? isDark
                            ? "text-red-400"
                            : "text-red-700"
                          : isDark
                            ? "text-white/40"
                            : "text-slate-400"
                      : isDark
                        ? "text-white"
                        : "text-slate-900"
                  )}
                >
                  {option.text}
                </span>
                {showResult && (
                  isCorrectOption ? (
                    <CheckCircle
                      size={20}
                      className={isDark ? "text-emerald-400" : "text-emerald-600"}
                    />
                  ) : isSelected ? (
                    <XCircle
                      size={20}
                      className={isDark ? "text-red-400" : "text-red-600"}
                    />
                  ) : null
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className={cn(
              "p-4 rounded-xl mb-6",
              isCorrect
                ? isDark
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-emerald-50 border border-emerald-200"
                : isDark
                  ? "bg-amber-500/10 border border-amber-500/20"
                  : "bg-amber-50 border border-amber-200"
            )}
          >
            <p
              className={cn(
                "text-sm font-medium mb-2",
                isCorrect
                  ? isDark
                    ? "text-emerald-400"
                    : "text-emerald-700"
                  : isDark
                    ? "text-amber-400"
                    : "text-amber-700"
              )}
            >
              {isCorrect ? "Correct!" : "Not quite..."}
            </p>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white/70" : "text-slate-600"
              )}
            >
              {currentQuestion.explanation}
            </p>
            {currentQuestion.relatedTermSlug && (
              <Link
                to="/learning-hub/glossary/$slug"
                params={{ slug: currentQuestion.relatedTermSlug }}
                className={cn(
                  "inline-flex items-center gap-1 mt-2 text-sm font-medium",
                  isDark
                    ? "text-[#E8FF4D] hover:text-[#d4eb45]"
                    : "text-violet-600 hover:text-violet-700"
                )}
              >
                Learn more
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              currentQuestionIndex === 0
                ? "opacity-50 cursor-not-allowed"
                : "",
              isDark
                ? "text-white/60 hover:text-white hover:bg-white/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {showExplanation && (
            <button
              onClick={handleNext}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-colors",
                isDark
                  ? "bg-[#E8FF4D] text-black hover:bg-[#d4eb45]"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              )}
            >
              {isLastQuestion ? "See Results" : "Next Question"}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Quiz;
