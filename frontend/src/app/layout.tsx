import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 👇 IMPORT THIS
import Providers from "@/components/providers"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life OS",
  description: "Daily tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 👇 WRAP CHILDREN HERE */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}