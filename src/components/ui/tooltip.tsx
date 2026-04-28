"use client";

import { useState, useRef, type ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timeout.current) clearTimeout(timeout.current);
    setVisible(true);
  }

  function hide() {
    timeout.current = setTimeout(() => setVisible(false), 150);
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div className="max-w-56 text-center leading-relaxed">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  );
}
