import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PageShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-dvh pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-6">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
