export default function Footer() {
  return (
    <footer className="flex-shrink-0 border-t border-gray-800 dark:border-gray-200 bg-gray-900 dark:bg-white py-2 px-4">
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} AI Chat App &nbsp;·&nbsp; Elaborado by{" "}
        <span className="font-semibold text-gray-300 dark:text-gray-600">Sherlock</span>
      </p>
    </footer>
  );
}
