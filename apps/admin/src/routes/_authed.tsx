import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-react-start";
import { useEffect } from "react";
import { SideNav } from "@/components/side-nav/SideNav";

export const Route = createFileRoute("/_authed" as any)({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({
        to: "/",
      });
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <div className="text-slate-400">Initializing systems...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <SideNav />
      <main className="flex-1 pl-[60px]">
        <Outlet />
      </main>
    </div>
  );
}
