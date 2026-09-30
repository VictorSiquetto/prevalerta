"use client";

import { useRef } from "react";

type BottomSheetProps = {
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  // Texto mostrado na alça quando a gaveta está recolhida.
  collapsedLabel: string | null;
  // Conteúdo fixo no topo (as abas da rota), fora da área que rola.
  header?: React.ReactNode;
  children: React.ReactNode;
};

// Arraste mínimo (em px) para contar como gesto; menos que isso é um toque.
const DRAG_THRESHOLD = 30;

// Gaveta do celular/tablet (abaixo de xl): fica na parte de baixo da tela e
// abre ou recolhe arrastando a alça ou tocando nela.
export default function BottomSheet({
  isExpanded,
  onExpandedChange,
  collapsedLabel,
  header,
  children,
}: BottomSheetProps) {
  const dragStartY = useRef<number | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Captura o ponteiro: o soltar é recebido mesmo que o dedo saia da alça.
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartY.current = event.clientY;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return;
    const delta = event.clientY - dragStartY.current;
    dragStartY.current = null;

    if (delta > DRAG_THRESHOLD) onExpandedChange(false);
    else if (delta < -DRAG_THRESHOLD) onExpandedChange(true);
    else onExpandedChange(!isExpanded);
  }

  return (
    <div
      data-map-overlay="bottom"
      className={`fixed inset-x-0 bottom-0 z-[1100] flex flex-col overflow-hidden rounded-t-2xl bg-white/95 shadow-2xl backdrop-blur-sm transition-[max-height] duration-300 ease-out xl:hidden dark:bg-zinc-900/95 ${
        isExpanded ? "max-h-[70dvh]" : "max-h-16"
      }`}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStartY.current = null;
        }}
        className="flex shrink-0 touch-none cursor-grab flex-col items-center justify-center gap-1 py-2 active:cursor-grabbing"
      >
        <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        {!isExpanded && collapsedLabel && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {collapsedLabel} (arraste para cima)
          </span>
        )}
      </div>

      {isExpanded && header && (
        <div className="shrink-0 px-4 pb-3">{header}</div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  );
}
