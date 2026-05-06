import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ТурнирХаб — Управление турнирами",
  description:
    "Платформа для управления спортивными турнирами. Создавайте турниры, управляйте командами, отслеживайте результаты и формируйте турнирные таблицы.",
  keywords: [
    "турнир",
    "управление",
    "спорт",
    "команды",
    "брекеты",
    "результаты",
    "ТурнирХаб",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ТурнирХаб — Управление турнирами",
    description:
      "Платформа для управления спортивными турнирами с поддержкой разных форматов.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
