import { AppShell } from "@/components/layout/app-shell";
import { WorkspacePage } from "@/components/shared/workspace-page";
import { ProductWorkspace } from "@/components/product/product-workspace";
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const section=slug[0]==="admin"?"admin":slug[0];const product=["ai-generator","releases","features","user-stories","backlog"].includes(section);return <AppShell>{product?<ProductWorkspace section={section}/>:<WorkspacePage section={section}/>}</AppShell>}
