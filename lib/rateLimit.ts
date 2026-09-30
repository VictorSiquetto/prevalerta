// Limite simples de pedidos por visitante (IP), guardado em memória. Em
// hospedagem serverless cada instância tem a própria memória, então não é
// um bloqueio exato — mas barra repetições em sequência (um script chamando
// a rota em loop, por exemplo) sem precisar de banco de dados.
const WINDOW_MS = 60_000;
const MAX_TRACKED_VISITORS = 1_000;
const requestTimes = new Map<string, number[]>();

function getClientIp(request: Request): string {
  // Na Vercel, o primeiro IP de x-forwarded-for é o do visitante.
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconhecido"
  );
}

export function isRateLimited(request: Request, maxPerMinute: number): boolean {
  const now = Date.now();
  const ip = getClientIp(request);
  const recent = (requestTimes.get(ip) ?? []).filter(
    (time) => now - time < WINDOW_MS
  );

  const limited = recent.length >= maxPerMinute;
  if (!limited) recent.push(now);
  requestTimes.set(ip, recent);

  // Esquece visitantes sem pedidos recentes, para o mapa não crescer sem fim.
  if (requestTimes.size > MAX_TRACKED_VISITORS) {
    for (const [key, times] of requestTimes) {
      if (now - times[times.length - 1] >= WINDOW_MS) requestTimes.delete(key);
    }
  }

  return limited;
}
