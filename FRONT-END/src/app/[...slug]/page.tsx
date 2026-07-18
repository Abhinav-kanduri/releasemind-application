import { AppShell } from "@/components/layout/app-shell";
import { WorkspacePage } from "@/components/shared/workspace-page";
import { notFound } from "next/navigation";
const removedRoutes=new Set(["ai-generator","releases","features","user-stories","backlog"]);
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;if(removedRoutes.has(slug[0]))notFound();const section=slug[0]==="admin"?"admin":slug[0];return <AppShell><WorkspacePage section={section}/></AppShell>}
