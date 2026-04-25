import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="page-ambient flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/90 p-10 text-center shadow-premium backdrop-blur-sm">
        <p className="mb-2 font-serif text-6xl font-semibold tracking-tight text-primary">404</p>
        <h1 className="mb-2 font-serif text-xl font-semibold text-foreground">Page not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">The page you’re looking for doesn’t exist or was moved.</p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
