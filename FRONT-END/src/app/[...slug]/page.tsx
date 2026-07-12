import { AppShell } from "@/components/layout/app-shell";
import { WorkspacePage } from "@/components/shared/workspace-page";
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const section=slug[0]==="admin"?"admin":slug[0];return <AppShell><WorkspacePage section={section}/></AppShell>}
