import { useEffect, useState } from "react";
import { Button, Input  } from "@axori/ui";
import { ArrowRight, Check } from "lucide-react";

interface EmailCaptureFormProps {
  source?: string;
  campaign?: string;
  variant?: "hero" | "footer" | "inline";
  onSuccess?: () => void;
}

interface FormState {
  firstName: string;
  email: string;
}

interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

/**
 * Get UTM parameters from the current URL
 */
function getUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    utmTerm: params.get("utm_term") || undefined,
  };
}

/**
 * Email Capture Form Component
 *
 * A form for capturing email signups for the waitlist.
 * Supports multiple variants for different placements.
 */
export function EmailCaptureForm({
  source = "homepage",
  campaign,
  variant = "hero",
  onSuccess,
}: EmailCaptureFormProps) {
  const [form, setForm] = useState<FormState>({ firstName: "", email: "" });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [utmParams, setUtmParams] = useState<UTMParams>({});

  // Capture UTM params on mount
  useEffect(() => {
    setUtmParams(getUTMParams());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/email-captures`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            email: form.email.trim().toLowerCase(),
            source,
            campaign,
            ...utmParams,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitState("success");
      setSuccessMessage(data.message || "You're on the list!");
      onSuccess?.();
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  };

  // Success state
  if (submitState === "success") {
    return (
      <div
        className={`
          flex items-center gap-3 rounded-2xl px-6 py-4
          bg-green-500/10 border border-green-500/20
          dark:bg-[#E8FF4D]/10 dark:border-[#E8FF4D]/20
          ${variant === "footer" ? "max-w-md" : ""}
        `}
      >
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center rounded-full
            bg-green-500 dark:bg-[#E8FF4D]
          "
        >
          <Check className="h-5 w-5 text-white dark:text-black" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-white">
          {successMessage}
        </p>
      </div>
    );
  }

  // Hero variant - side by side on desktop
  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            variant="rounded"
            required
            className="flex-1 sm:max-w-[160px]"
            disabled={submitState === "submitting"}
          />
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            variant="rounded"
            required
            className="flex-[2]"
            disabled={submitState === "submitting"}
          />
          <Button
            type="submit"
            isLoading={submitState === "submitting"}
            className="rounded-2xl px-8 py-4 text-sm font-bold uppercase tracking-wider shrink-0"
          >
            Join Waitlist
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {submitState === "error" && errorMessage && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </form>
    );
  }

  // Footer variant - stacked
  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            variant="rounded"
            required
            disabled={submitState === "submitting"}
          />
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            variant="rounded"
            required
            disabled={submitState === "submitting"}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submitState === "submitting"}
            className="rounded-2xl py-4 uppercase tracking-wider"
          >
            {submitState === "submitting" ? "Joining..." : "Join Waitlist"}
          </Button>
        </div>
        {submitState === "error" && errorMessage && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </form>
    );
  }

  // Inline variant - single row
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
          className="flex-1"
          disabled={submitState === "submitting"}
        />
        <Input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="flex-1"
          disabled={submitState === "submitting"}
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={submitState === "submitting"}
        >
          Join
        </Button>
      </div>
      {submitState === "error" && errorMessage && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
