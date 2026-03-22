"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show Navbar/Footer on workspace/dashboard routes
  const isWorkspace = pathname?.startsWith("/workspace") || pathname?.startsWith("/dashboard");

  if (isWorkspace) {
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
