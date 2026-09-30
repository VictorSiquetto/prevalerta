import type { NextConfig } from "next";

// Cabeçalhos de segurança enviados em todas as páginas e rotas da API.
const securityHeaders = [
  // Impede que o site seja exibido dentro de páginas de outros sites
  // (proteção contra clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Impede o navegador de "adivinhar" o tipo de um arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Desliga recursos do navegador que o app não usa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Não anuncia nas respostas qual framework o site usa.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
