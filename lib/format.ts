const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}
