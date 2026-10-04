import L from "leaflet";

export const MAX_FIT_ZOOM = 14;
export const ROUTE_MAX_ZOOM = 12;

const MIN_VISIBLE_SIZE = 160;
const GAP = 24;

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
      if (rect.width === 0 || rect.height === 0) return;

      switch (element.dataset.mapOverlay) {
        case "top":
          top = Math.max(top, rect.bottom - mapRect.top);
          break;
        case "bottom": {
          const maxHeight = parseFloat(getComputedStyle(element).maxHeight);
          const covered = mapRect.bottom - rect.top;
          bottom = Math.max(
            bottom,
            Number.isFinite(maxHeight) ? Math.max(covered, maxHeight) : covered
          );
          break;
        }
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
    const deficit = MIN_VISIBLE_SIZE - freeHeight;
    const fromTop = Math.min(deficit, top);
    top -= fromTop;
    bottom = Math.max(0, bottom - (deficit - fromTop));
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
