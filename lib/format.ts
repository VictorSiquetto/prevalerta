const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

// Números no padrão brasileiro (vírgula decimal): 5.6 -> "5,6".
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}
