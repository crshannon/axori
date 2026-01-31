import { createFileRoute } from "@tanstack/react-router";
import { MorningBriefing } from "@/components/briefing";

export const Route = createFileRoute("/_authed/dashboard" as never)({
  component: DashboardPage,
});

function DashboardPage() {
  return <MorningBriefing />;
}
