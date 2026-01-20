import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // ✅ Correct location
import Providers from "@/components/providers"; 
import ConfirmModal from "@/components/shared/ConfirmModal"; 
import CreateItemModal from "@/components/features/tracker/CreateItemModal"; 

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
        <Providers>
          {children}
          
          {/* Global Modals live here */}
          <ConfirmModal /> 
          <CreateItemModal />

        </Providers>
      </body>
    </html>
  );
}