import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { SyncUser } from "@/components/SyncUser";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Real-Time Messenger",
  description: "A real-time messaging application built with Next.js, Convex, and Clerk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          <SyncUser />
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
