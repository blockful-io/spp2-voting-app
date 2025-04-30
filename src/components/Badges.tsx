/**
 * Standardized badge components used across the application
 */

/**
 * Badge component displayed for Basic budget type
 */
export function BasicBadge() {
  return (
    <span className="rounded-full bg-stone-900 px-2 py-1 text-xs ml-2 font-medium text-gray-400">
      Basic
    </span>
  );
}

/**
 * Badge component displayed for Extended budget type
 */
export function ExtendedBadge() {
  return (
    <span className="rounded-full bg-stone-900 px-2 py-1 text-xs ml-2 font-medium text-gray-400">
      Extended
    </span>
  );
}

/**
 * Badge component displayed for Combined budget type
 */
export function CombinedBadge() {
  return (
    <span className="rounded-full bg-stone-900 px-2 py-1 text-xs ml-2 font-medium text-gray-400">
      Basic + Extended
    </span>
  );
}

/**
 * Badge component displayed for funded/winning candidates
 */
export function FundedBadge() {
  return (
    <span className="rounded-full flex items-center gap-2 text-black bg-[#4ADE80] p-[6px] text-xs font-medium">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
      </svg>
    </span>
  );
}

/**
 * Badge component displayed for non-funded candidates with reason tooltip
 */
export function NotFundedBadge({ reason }: { reason: string | null }) {
  return (
    <div className="group relative inline-flex items-center">
      <span className="rounded-xl py-1 px-2 bg-gray-700 bg-opacity-10 text-gray-400">
        Not funded
      </span>
      <div className="absolute left-full ml-2 hidden group-hover:block z-50">
        <div className="rounded-md bg-gray-800 p-2 text-xs text-gray-200 shadow-lg whitespace-nowrap">
          {reason || "Unknown reason"}
        </div>
      </div>
    </div>
  );
} 