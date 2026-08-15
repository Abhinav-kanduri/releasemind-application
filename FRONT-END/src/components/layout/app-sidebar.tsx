"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  Database,
  FileChartColumn,
  GitFork,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  ShieldCheck,
  TestTube2,
  Waypoints,
  Workflow,
  X,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
const groups = [
  {
    title: "Workspace",
    items: [
      ["Overview", "/dashboard", LayoutDashboard],
      ["Architecture", "/architecture", Network],
      ["Ask ReleaseLens", "/assistant", Bot],
      ["Data Sources", "/data-sources", Database],
    ],
  },
  {
    title: "Explore",
    items: [
      ["Knowledge Explorer", "/knowledge", Search],
      ["Traceability", "/traceability", GitFork],
      ["Impact Analysis", "/impact-analysis", Waypoints],
      ["RAG Validation", "/rag-validation", Workflow],
      ["API Explorer", "/api-explorer", Boxes],
      ["Test Intelligence", "/test-intelligence", TestTube2],
    ],
  },
  {
    title: "Operations",
    items: [
      ["Reports", "/reports", FileChartColumn],
      ["Governance", "/governance", ShieldCheck],
      ["AI Guardrails", "/guardrails", Activity],
    ],
  },
  {
    title: "Administration",
    items: [
      ["Administration", "/admin/users", BarChart3],
      ["Settings", "/settings", Settings],
    ],
  },
];
export function AppSidebar() {
  const path = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="brand">
        <b>R</b>
        <span>
          Release<em>Lens</em>
          <small>AI KNOWLEDGE PLATFORM</small>
        </span>
        <button onClick={toggleSidebar} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>
      <nav>
        {groups.map((group) => (
          <section key={group.title}>
            <p>{group.title}</p>
            {group.items.map(([label, href, Icon]) => (
              <Link
                key={href as string}
                href={href as string}
                className={path === href ? "active" : ""}
                onClick={() => sidebarOpen && toggleSidebar()}
              >
                <Icon size={17} />
                <span>{label as string}</span>
              </Link>
            ))}
          </section>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="status">
          <i />
          <span>
            <b>Platform operational</b>
            <small>8 services healthy</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
