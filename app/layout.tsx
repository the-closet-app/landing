import type { Metadata } from "next";
import { antiqueLegacy, mackinac } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLAi",
  description: "Transforming your closet into a personal decision engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${antiqueLegacy.variable} ${mackinac.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
