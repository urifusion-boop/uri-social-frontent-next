"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl" style={{ color: 'hsl(var(--muted-foreground))' }}>Oops! Page not found</p>
        <a href="/" className="underline" style={{ color: 'hsl(var(--primary))' }} onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--primary) / 0.9)'} onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--primary))'}>
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
