"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button className="mr-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-menu"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Electionful</h1>
        </div>
        <nav className="flex space-x-6">
          <button
            onClick={() => router.push("/votes")}
            className="text-gray-600 hover:text-gray-900"
          >
            Vote
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            Results
          </button>
        </nav>
      </div>
    </header>
  );
}
