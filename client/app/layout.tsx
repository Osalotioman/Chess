import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "./components/AppNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chess Championship Arena",
  description: "Responsive Next.js frontend for Chess Championship Arena",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh bg-[radial-gradient(circle_at_15%_15%,rgba(110,231,183,0.1),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(251,191,36,0.12),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-200 antialiased`}
      >
        <AppNav />
        {children}
      </body>
    </html>
  );
}
