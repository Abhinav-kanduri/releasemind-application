import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ImpactAnalysisDashboard } from "@/components/impact-analysis/impact-analysis-dashboard";

export default function Page() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <main className="dashboard impact-dashboard">
            <div
              className="impact-loading"
              aria-label="Loading impact analysis"
            >
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton wide" />
            </div>
          </main>
        }
      >
        <ImpactAnalysisDashboard />
      </Suspense>
    </AppShell>
  );
}
