"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClientOnly } from "./ClientOnly";
import { EnsLogo } from "./icons/EnsLogo";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isVotePage = pathname === "/vote";

  return (
    <div className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-gray-100">
        <Link href="/" className="flex items-center gap-2 group">
          {isVotePage && (
            <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
          )}
          <EnsLogo className="h-6 w-6" />
          <span className="text-xl font-normal">ENS</span>
          <span className="text-gray-500 group-hover:text-white transition-colors duration-300">
            |
          </span>
          <span className="text-gray-500 group-hover:text-white transition-colors duration-300">
            {isVotePage ? "Cast your vote now" : "SPP2 Voting"}
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {!isVotePage && (
            <Link
              href="/vote"
              className="rounded-lg flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200 duration-300"
            >
              Start voting <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <ClientOnly>
            <ConnectButton />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
