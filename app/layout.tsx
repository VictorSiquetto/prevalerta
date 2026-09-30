import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Clima atual, previsão das próximas horas, alertas oficiais do INMET e classificação de risco para cidades e rotas do Estado de São Paulo.";

export const metadata: Metadata = {
  metadataBase: new URL("https://prev-alerta.vercel.app"),
  title: "PreVAlerta",
  description,
  applicationName: "PreVAlerta",
  openGraph: {
    title: "PreVAlerta",
    description,
    url: "/",
    siteName: "PreVAlerta",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
