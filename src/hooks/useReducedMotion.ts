"use client";

import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("motion:reduced");
    if (stored === "true") {
      setPrefersReduced(true);
      document.documentElement.classList.add("reduced-motion");
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const shouldReduce = stored === "true" || mediaQuery.matches;
      setPrefersReduced(shouldReduce);
      document.documentElement.classList.toggle("reduced-motion", shouldReduce);
    };
    update();
    try {
      mediaQuery.addEventListener("change", update);
    } catch {
      // Safari fallback
      mediaQuery.addListener(update);
    }
    return () => {
      try {
        mediaQuery.removeEventListener("change", update);
      } catch {
        mediaQuery.removeListener(update);
      }
    };
  }, []);

  const setReduced = (value: boolean) => {
    setPrefersReduced(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("motion:reduced", value ? "true" : "false");
    }
    document.documentElement.classList.toggle("reduced-motion", value);
  };

  return { prefersReduced, setReduced } as const;
}


