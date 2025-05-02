"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClientOnly } from "./ClientOnly";
import { EnsLogo } from "./icons/EnsLogo";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isVotePage = pathname === "/vote";

  return (
    <div className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black flex flex-col">
      {/* Main header */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-gray-100">
        <Link href="/" className="flex items-center gap-2 group">
          <EnsLogo className="h-6 w-6" />
          <span className="text-xl font-normal">ENS</span>
          <span className="text-gray-500 group-hover:text-white transition-colors duration-300 sm:block">
            SPP2 Voting
          </span>
        </Link>
        
        {/* Desktop tabs */}
        <div className="items-center relative hidden md:flex">
          <Link 
            href="/" 
            className={`relative px-4 h-16 flex items-center text-base font-medium transition-colors duration-300 ${!isVotePage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Results
            {!isVotePage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
          <div className={`flex items-center ${isVotePage ? 'relative' : ''}`}>
            <Link 
              href="/vote" 
              className={`px-4 h-16 flex items-center text-base font-medium transition-colors duration-300 ${isVotePage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
            >
              Vote
            </Link>
            {isVotePage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </div>
        </div>
        
        <ClientOnly>
          <ConnectButton />
        </ClientOnly>
      </div>
      
      {/* Mobile tabs - shown below header */}
      <div className="w-full border-t border-gray-800 md:hidden">
        <div className="mx-auto w-full max-w-7xl flex items-center">
          <Link 
            href="/" 
            className={`relative w-1/2 py-2.5 flex justify-center items-center text-base font-medium transition-colors duration-300 ${!isVotePage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Results
            {!isVotePage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
          <div className={`relative w-1/2 flex flex-col ${isVotePage ? '' : ''}`}>
            <div className="flex items-center justify-between w-full">
              <Link 
                href="/vote" 
                className={`py-2.5 flex-1 flex justify-center items-center text-base font-medium transition-colors duration-300 ${isVotePage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
              >
                Vote
              </Link>
            </div>
            {isVotePage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
