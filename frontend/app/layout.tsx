import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chat App",
  description: "Chat con inteligencia artificial potenciado por Claude",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-white antialiased">{children}</body>
    </html>
  );
}
