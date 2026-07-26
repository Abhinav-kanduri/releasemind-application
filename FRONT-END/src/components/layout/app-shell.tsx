"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import {
  WorkspaceContextBar,
  WorkspaceContextProvider,
} from "@/workspace-context";
import { AppSidebar } from "./app-sidebar";
import { TopHeader } from "./top-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark" ||
        (theme === "system" &&
          matchMedia("(prefers-color-scheme:dark)").matches),
    );
  }, [theme]);
  return (
    <WorkspaceContextProvider>
      <div className="shell">
        <AppSidebar />
        <div className="main">
          <TopHeader />
          <WorkspaceContextBar />
          {children}
        </div>
      </div>
    </WorkspaceContextProvider>
  );
}
