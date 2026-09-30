import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
