"use client";

import { useRef, useState, useSyncExternalStore } from "react";

type ResizablePanelProps = {
  side: "left" | "right";
  className?: string;
  children: React.ReactNode;
};

const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const MAX_VIEWPORT_FRACTION = 0.3;
const KEYBOARD_STEP = 32;
const DOUBLE_CLICK_MS = 350;

function storageKey(side: ResizablePanelProps["side"]) {
  return `prevalerta:panel-width:${side}`;
}

function readSavedWidth(side: ResizablePanelProps["side"]): number {
  try {
    const saved = Number(window.localStorage.getItem(storageKey(side)));
    return Number.isFinite(saved) && saved > 0 ? saved : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

function saveWidth(side: ResizablePanelProps["side"], width: number) {
  try {
    window.localStorage.setItem(storageKey(side), String(Math.round(width)));
  } catch {
  }
}

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export default function ResizablePanel({
  side,
  className = "",
  children,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(() => readSavedWidth(side));
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; width: number } | null>(null);
  const lastPointerDown = useRef(0);

  const viewportWidth = useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth,
    () => 1920
  );
  const maxWidth = Math.max(
    MIN_WIDTH,
    Math.min(MAX_WIDTH, viewportWidth * MAX_VIEWPORT_FRACTION)
  );
  const clamp = (value: number) =>
    Math.min(maxWidth, Math.max(MIN_WIDTH, value));
  const currentWidth = clamp(width);

  function updateWidth(value: number) {
    const next = clamp(value);
    setWidth(next);
    saveWidth(side, next);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.timeStamp - lastPointerDown.current < DOUBLE_CLICK_MS) {
      lastPointerDown.current = 0;
      updateWidth(DEFAULT_WIDTH);
      return;
    }
    lastPointerDown.current = event.timeStamp;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, width: currentWidth };
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const delta = event.clientX - dragStart.current.x;
    setWidth(clamp(dragStart.current.width + (side === "left" ? delta : -delta)));
  }

  function handlePointerUp() {
    if (!dragStart.current) return;
    dragStart.current = null;
    setIsDragging(false);
    saveWidth(side, currentWidth);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const grow = side === "left" ? "ArrowRight" : "ArrowLeft";
    const shrink = side === "left" ? "ArrowLeft" : "ArrowRight";
    if (event.key === grow) updateWidth(currentWidth + KEYBOARD_STEP);
    else if (event.key === shrink) updateWidth(currentWidth - KEYBOARD_STEP);
    else if (event.key === "Home") updateWidth(MIN_WIDTH);
    else if (event.key === "End") updateWidth(maxWidth);
    else return;
    event.preventDefault();
  }

  return (
    <div
      data-map-overlay={side}
      className={`fixed top-24 bottom-4 ${className}`}
      style={{ width: currentWidth }}
    >
      {children}

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar painel"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={Math.round(maxWidth)}
        aria-valuenow={Math.round(currentWidth)}
        tabIndex={0}
        title="Arraste para redimensionar (duplo clique restaura)"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={`group absolute top-0 bottom-0 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center outline-none ${
          side === "left" ? "-right-1.5" : "-left-1.5"
        }`}
      >
        <div
          className={`h-12 w-1.5 rounded-full transition-colors group-hover:bg-blue-500 group-focus-visible:bg-blue-500 ${
            isDragging ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"
          }`}
        />
      </div>
    </div>
  );
}
