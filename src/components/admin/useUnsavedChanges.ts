"use client";

import { useEffect, useId } from "react";

/**
 * Figyelmeztetés, ha mentetlen változással akarja elhagyni az oldalt
 * (böngészőfül bezárása, frissítés, vagy kattintás egy másik Admin oldalra).
 * Több űrlap is jelezhet egyszerre – egyetlen figyelmeztetés jelenik meg.
 */
const dirtySources = new Set<string>();
let listenersInstalled = false;

const MESSAGE = "Mentetlen változtatásaid vannak. Biztosan elhagyod az oldalt? A változtatások elvesznek.";

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirtySources.size === 0) return;
  event.preventDefault();
  event.returnValue = "";
}

function onDocumentClick(event: MouseEvent) {
  if (dirtySources.size === 0 || event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;
  if (!window.confirm(MESSAGE)) {
    event.preventDefault();
    event.stopPropagation();
  } else {
    dirtySources.clear();
  }
}

function install() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  window.addEventListener("beforeunload", onBeforeUnload);
  document.addEventListener("click", onDocumentClick, true);
}

export function useUnsavedChanges(dirty: boolean): void {
  const id = useId();
  useEffect(() => {
    install();
    if (dirty) dirtySources.add(id);
    else dirtySources.delete(id);
    return () => {
      dirtySources.delete(id);
    };
  }, [dirty, id]);
}
