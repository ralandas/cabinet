import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import "./layout.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth-guard";

export const metadata: Metadata = {
  title: "Progon Pro — ИИ-агент для посуточной аренды",
  description: "Кабинет управления ИИ-агентом. Подключите Telegram, PMS и запустите автоматические продажи.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
