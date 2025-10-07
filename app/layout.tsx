import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prism Capital - Smart Portfolio Tracking",
  description: "Smart Portfolio Tracking for Trades and Investments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}