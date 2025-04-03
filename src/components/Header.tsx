import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClientOnly } from "./ClientOnly";

export function Header() {
  return (
    <div className="w-full border-b border-gray-800 bg-dark">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="text-xl font-semibold">Electionful</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <Link href="/" className="transition-colors hover:text-blue-400">
              Results
            </Link>

            <Link
              href="/vote"
              className="transition-colors hover:text-blue-400"
            >
              Vote
            </Link>
          </nav>
          <ClientOnly>
            <ConnectButton />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
