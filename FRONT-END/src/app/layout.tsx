import type { Metadata } from "next";import "./globals.css";import "./dashboard.css";import "./chat.css";
export const metadata:Metadata={title:"ReleaseLens AI",description:"AI-Powered Release-Aware Product Knowledge Platform"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
