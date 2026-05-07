export default function Footer() {
  return (
    <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 py-2 px-4">
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        © {new Date().getFullYear()} AI Chat App &nbsp;·&nbsp; Elaborado by{" "}
        <span className="font-semibold text-gray-500 dark:text-gray-400">Sherlock</span>
      </p>
    </footer>
  );
}
