"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GlobalContext, Theme } from "@/types";
type AppStore = GlobalContext & { sidebarOpen:boolean; setContext:(data:Partial<GlobalContext>)=>void; setTheme:(theme:Theme)=>void; toggleSidebar:()=>void };
export const useAppStore = create<AppStore>()(persist((set)=>({tenantId:"acme-enterprise",productId:"commerce-cloud",productName:"Commerce Cloud",environment:"Production",selectedRelease:"3.2.1",comparisonRelease:"3.1.0",userRole:"Platform Architect",theme:"light",sidebarOpen:false,setContext:(data)=>set(data),setTheme:(theme)=>set({theme}),toggleSidebar:()=>set((s)=>({sidebarOpen:!s.sidebarOpen}))}),{name:"releaselens-context"}));
