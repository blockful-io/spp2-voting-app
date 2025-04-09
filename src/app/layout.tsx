import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Providers } from "./providers";
import HotjarScript from "@/lib/behavior";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SPP2 voting",
  description: "A simple voting interface for ENS Service Provider Program 2 election",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <HotjarScript />
      </head>
      <body className={`${inter.className} bg-black min-h-screen`}>
        <Providers>
          <>
            <Header />
            {children}
          </>
        </Providers>
      </body>
    </html>
  );
}
