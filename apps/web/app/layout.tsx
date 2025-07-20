import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth/session";
import { CurrentUserProvider } from "@/lib/providers/current-user";
import { WebSocketProvider } from "@/lib/providers/web-socket";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zyncode",
  description: "collaborative code editor",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status, user } = await getCurrentUser();
  if (status === "error") {
    throw new Error();
  }

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CurrentUserProvider currentUser={user}>
          <WebSocketProvider>
            <main>{children}</main>
          </WebSocketProvider>
        </CurrentUserProvider>
        <Toaster />
      </body>
    </html>
  );
}
