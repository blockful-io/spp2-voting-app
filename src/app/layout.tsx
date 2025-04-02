import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Electionful",
  description: "spp 2 voting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          <div className="z-20 flex w-full items-center justify-center border-b border-b-lightDark bg-dark px-5 shadow-xl shadow-dark">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-gray-100">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="text-xl font-semibold">Electionful</span>
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/"
                  className="transition-colors hover:text-blue-400"
                >
                  Results
                </Link>

                <Link
                  href="/vote"
                  className="transition-colors hover:text-blue-400"
                >
                  Vote
                </Link>
              </div>
            </div>
          </div>
          {children}
        </Provider>
      </body>
    </html>
  );
}
