import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoNavbar } from "@/components/DemoNavbar";

export const metadata: Metadata = {
  title: "AegisVoice — Real-Time Emergency Voice AI & CAD Dispatch",
  description:
    "Autonomous distress intelligence powered by AssemblyAI Universal-3.5-Pro and LeMUR LLM Gateway.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070B12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070B12] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
        <DemoNavbar />
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
