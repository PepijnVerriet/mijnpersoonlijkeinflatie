import type { ReactNode } from "react";
import { Topbar } from "@/components/ui/Topbar";

export default function CheckLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Topbar />
      {children}
    </div>
  );
}
