// src/app/layout.tsx
import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DatabaseSyncWrapper } from "@/components/auth/DatabaseSyncWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TagalogLearn - Learn Tagalog Online",
  description: "A fun and interactive way to learn Tagalog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body>
        <Providers>
          <DatabaseSyncWrapper>
            {children}
          </DatabaseSyncWrapper>
        </Providers>
      </body>
    </html>
  );
}