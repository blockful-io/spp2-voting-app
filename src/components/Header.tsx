"use client";

import Link from "next/link";
import { ClientOnly } from "./ClientOnly";
import { EnsLogo } from "./icons/EnsLogo";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { CustomConnectButton } from "./CustomConnectButton";

export function Header() {
  const pathname = usePathname();
  const isVotePage = pathname === "/vote";
  const isVotesPage = pathname === "/votes";
  const isResultsPage = pathname === "/";

  return (
    <div className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black flex flex-col">
      {/* Main header */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-gray-100">
        <Link href="/" className="flex items-center gap-2 group">
          <EnsLogo className="h-6 w-6" />
          <span className="text-xl font-normal hidden sm:block">ENS</span>
          <span className="text-gray-500 group-hover:text-white transition-colors duration-300 sm:block">
            SPP2 Voting
          </span>
        </Link>
        
        {/* Desktop tabs */}
        <div className="items-center relative hidden md:flex">
          <Link 
            href="/" 
            className={`relative px-4 h-16 flex items-center text-base font-medium transition-colors duration-300 ${isResultsPage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Results
            {isResultsPage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
          <span className="text-gray-700">|</span>
          <Link 
            href="/votes" 
            className={`relative px-4 h-16 flex items-center text-base font-medium transition-colors duration-300 ${isVotesPage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            See votes
            {isVotesPage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
          <span className="text-gray-700">|</span>
          <Link 
            href="/vote" 
            className={`relative px-4 h-16 flex items-center text-base font-medium transition-colors duration-300 ${isVotePage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Cast your vote
            {isVotePage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
        </div>
        
        <ClientOnly>
          <CustomConnectButton />
        </ClientOnly>
      </div>
      
      {/* Mobile tabs - shown below header */}
      <div className="w-full border-t border-gray-800 md:hidden">
        <div className="mx-auto w-full max-w-7xl flex items-center">
          <Link 
            href="/" 
            className={`relative w-1/4 py-2.5 flex justify-center items-center text-base font-medium transition-colors duration-300 ${isResultsPage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Results
            {isResultsPage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
          <Link 
            href="/votes" 
            className={`relative w-1/3 py-2.5 flex justify-center items-center text-base font-medium transition-colors duration-300 ${isVotesPage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            See votes
            {isVotesPage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
          <Link 
            href="/vote" 
            className={`relative w-2/5 py-2.5 flex justify-center items-center text-base font-medium transition-colors duration-300 ${isVotePage ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Cast your vote
            {isVotePage && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
          </Link>
        </div>
      </div>
    </div>
  );
}
