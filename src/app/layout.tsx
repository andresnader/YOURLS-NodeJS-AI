import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "YOURLS Node — Refractive URL Shortener",
  description: "Your Own URL Shortener — Powerful self-hosted link management with analytics, built on Node.js",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col relative">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
