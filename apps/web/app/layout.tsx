import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth/session";
import CurrentUserProvider from "@/lib/providers/current-user-provider";
import WebSocketProvider from "@/lib/providers/web-socket-provider";
import WorkspaceProvider from "@/lib/providers/workspace-provider";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "zyncode",
  description: "Collaborative code editor for devs",
  icons: {
    icon: '/favicon.svg'
  }
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
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
      >
        <CurrentUserProvider currentUser={user}>
          <WorkspaceProvider>
            <main className="font-montserrat" >{children}</main>
          </WorkspaceProvider>
        </CurrentUserProvider>
        <Toaster />
      </body>
    </html>
  );
}
