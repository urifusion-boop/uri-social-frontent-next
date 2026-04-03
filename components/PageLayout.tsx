"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show Navbar/Footer on app routes
  const isApp =
    pathname?.startsWith("/workspace") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/social-media") ||
    pathname?.startsWith("/settings") ||
    pathname === "/login";

  if (isApp) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
