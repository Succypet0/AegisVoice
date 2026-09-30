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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#070B12] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-black">
        <DemoNavbar />
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
