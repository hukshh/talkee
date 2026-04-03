import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { SyncUser } from "@/components/SyncUser";
import { Toaster } from "@/components/ui/sonner";
import { IncomingCallAlert } from "@/components/IncomingCallAlert";
import { Preloader } from "@/components/Preloader";
import { NavProvider } from "@/context/NavContext";
import { MobileNavbarWrapper } from "@/components/MobileNavbarWrapper";

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexClientProvider>
          <NavProvider>
            <SyncUser />
            <IncomingCallAlert />
            <Preloader>
              {children}
            </Preloader>
            <MobileNavbarWrapper />
            <Toaster />
          </NavProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
