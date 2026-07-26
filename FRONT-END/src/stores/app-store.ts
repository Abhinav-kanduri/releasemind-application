"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GlobalContext, Theme } from "@/types";
type AppStore = GlobalContext & { sidebarOpen:boolean; setTheme:(theme:Theme)=>void; toggleSidebar:()=>void };
export const useAppStore = create<AppStore>()(persist((set)=>({tenantId:"acme-enterprise",userRole:"Platform Architect",theme:"light",sidebarOpen:false,setTheme:(theme)=>set({theme}),toggleSidebar:()=>set((s)=>({sidebarOpen:!s.sidebarOpen}))}),{name:"releaselens-preferences"}));
