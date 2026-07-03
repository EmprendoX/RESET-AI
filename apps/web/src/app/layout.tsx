import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./reset-shell.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RESET-ORDER · Coach",
  description: "Tu coach de RESET-ORDER: orden, reset y crecimiento. Cumple tu sistema día a día.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink">
        {/* Barra global de RESET-ORDER (navegación cross-app / vuelta al hub). */}
        <div id="reset-shell-root" />
        {children}
        <Script src="/shell/shell.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
