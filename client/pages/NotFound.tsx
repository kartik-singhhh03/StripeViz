import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { DarkLayout } from "@/components/DarkLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <DarkLayout>
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="text-center">
          <h1 className="text-8xl font-bold mb-4 text-[var(--text-primary)]">404</h1>
          <p className="text-xl text-[var(--text-muted)] mb-8">Oops! Page not found</p>
          <a href="/" className="btn-primary inline-block">
            Return to Home
          </a>
        </div>
      </div>
    </DarkLayout>
  );
};

export default NotFound;
