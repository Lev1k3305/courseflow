import "./globals.css";
import { Inter } from "next/font/google";

import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CourseFlow — Интерактивное обучение ИИ",
  description: "Осваивай современные LLM, Gemini API, ООП и разработку на Flutter по четким урокам.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
