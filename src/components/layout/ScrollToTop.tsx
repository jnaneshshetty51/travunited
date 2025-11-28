"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Component that scrolls to top on route change
 * This ensures all pages load from the top when navigating
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top when pathname changes
    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant", // Use instant for immediate scroll, or "smooth" for animated
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Also handle initial page load
  useEffect(() => {
    // Scroll to top on initial mount
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);

  return null;
}

