import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh - 100px)] bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Page Not Found</h2>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
      >
        Return Home
      </Link>
    </div>
  );
}
