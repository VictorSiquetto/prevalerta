import L from "leaflet";

// Zoom máximo ao enquadrar uma cidade (evita aproximar demais nas muito
// pequenas) e ao enquadrar uma rota.
export const MAX_FIT_ZOOM = 14;
export const ROUTE_MAX_ZOOM = 12;

// Espaço livre mínimo para o enquadramento, em pixels. Se os painéis
// cobrirem mais que isso, a margem daquele eixo é reduzida.
const MIN_VISIBLE_SIZE = 160;
const GAP = 24;

// Elementos que ficam por cima do mapa (busca, painéis laterais, gaveta do
// celular) marcam com `data-map-overlay="top|bottom|left|right"` o lado
// que cobrem. Na hora de enquadrar, medimos cada um visível e usamos como
// margem, para a cidade ou rota ficar centralizada na parte livre do mapa.
// Medir na hora (em vez de usar valores fixos) acompanha os painéis
// redimensionáveis, a gaveta aberta/fechada e o tamanho da tela.
export function getOverlayPadding(map: L.Map): L.FitBoundsOptions {
  const mapRect = map.getContainer().getBoundingClientRect();
  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;

  document
    .querySelectorAll<HTMLElement>("[data-map-overlay]")
    .forEach((element) => {
      const rect = element.getBoundingClientRect();
      // Escondido (ex.: painel só de desktop numa tela de celular).
      if (rect.width === 0 || rect.height === 0) return;

      switch (element.dataset.mapOverlay) {
        case "top":
          top = Math.max(top, rect.bottom - mapRect.top);
          break;
        case "bottom":
          bottom = Math.max(bottom, mapRect.bottom - rect.top);
          break;
        case "left":
          left = Math.max(left, rect.right - mapRect.left);
          break;
        case "right":
          right = Math.max(right, mapRect.right - rect.left);
          break;
      }
    });

  const freeHeight = mapRect.height - top - bottom - 2 * GAP;
  if (freeHeight < MIN_VISIBLE_SIZE) {
    bottom = Math.max(0, bottom - (MIN_VISIBLE_SIZE - freeHeight));
  }
  const freeWidth = mapRect.width - left - right - 2 * GAP;
  if (freeWidth < MIN_VISIBLE_SIZE) {
    const excess = (MIN_VISIBLE_SIZE - freeWidth) / 2;
    left = Math.max(0, left - excess);
    right = Math.max(0, right - excess);
  }

  return {
    paddingTopLeft: L.point(left + GAP, top + GAP),
    paddingBottomRight: L.point(right + GAP, bottom + GAP),
  };
}
