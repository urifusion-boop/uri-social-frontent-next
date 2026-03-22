import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import PageLayout from "@/components/PageLayout";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: "URI Social - AI-Powered Social Media Manager",
  description: "Meet Jane, your AI social media manager who creates posts, publishes on time, and delivers results 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className={urbanist.className}>
        <PageLayout>{children}</PageLayout>
      </body>
    </html>
  );
}
