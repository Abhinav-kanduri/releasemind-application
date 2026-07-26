"use client";

import { Bell, CalendarDays, HelpCircle, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/app-store";

export function TopHeader() {
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const path = usePathname();
  const crumbs = path
    .split("/")
    .filter(Boolean)
    .filter((part) => part !== "workspace")
    .map((part) =>
      part
        .split("-")
        .map((word) => word[0]?.toUpperCase() + word.slice(1))
        .join(" "),
    );
  return (
    <header className="top-header">
      <button
        className="mobile-menu"
        onClick={toggleSidebar}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      <div className="breadcrumbs desktop-only">
        <span>Workspace</span>
        {crumbs.map((crumb) => (
          <span key={crumb}>
            <b>/</b> <strong>{crumb}</strong>
          </span>
        ))}
      </div>
      <label className="global-search desktop-only">
        <Search />
        <input
          aria-label="Global search"
          placeholder="Search knowledge, releases, APIs…"
        />
        <kbd>Ctrl K</kbd>
      </label>
      <span className="top-header-context-note desktop-only">
        Context is shared across ReleaseMind
      </span>
      <button className="head-icon desktop-only" aria-label="Date range">
        <CalendarDays />
      </button>
      <button className="head-icon desktop-only" aria-label="Help">
        <HelpCircle />
      </button>
      <button className="head-icon notify" aria-label="Notifications">
        <Bell />
        <i />
      </button>
    </header>
  );
}
