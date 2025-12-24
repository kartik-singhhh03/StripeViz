import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component - scrolls to top of page on route change
 * Place this inside BrowserRouter to enable automatic scroll restoration
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
