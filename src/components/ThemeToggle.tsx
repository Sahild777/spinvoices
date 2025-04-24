import React from "react";

export default function ThemeToggle({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  return (
    <button
      aria-label="Toggle theme"
      className="mr-4 p-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      type="button"
    >
      {theme === "light" ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="yellow" /><path stroke="currentColor" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95l-1.414-1.414M6.05 6.05L4.636 4.636m12.728 0l-1.414 1.414M6.05 17.95l-1.414 1.414" /></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke="currentColor" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="black" /></svg>
      )}
    </button>
  );
}
