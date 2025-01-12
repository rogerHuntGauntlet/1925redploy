export default function LegalPage() {
  return (
    <article>
      <h1 className="text-4xl font-bold mb-6">Legal Documents</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        All our legal documents and policies are listed below.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/legal/terms" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Terms & Conditions</h2>
          <p className="text-gray-600 dark:text-gray-400">Our terms of service and usage conditions</p>
        </a>

        <a href="/legal/privacy" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
          <p className="text-gray-600 dark:text-gray-400">How we handle and protect your data</p>
        </a>

        <a href="/legal/data-policy" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Data Policy</h2>
          <p className="text-gray-600 dark:text-gray-400">Our data handling and retention practices</p>
        </a>

        <a href="/legal/ai-policy" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">AI Policy</h2>
          <p className="text-gray-600 dark:text-gray-400">How we use and train our AI systems</p>
        </a>

        <a href="/legal/no-refund-policy" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">No Refund Policy</h2>
          <p className="text-gray-600 dark:text-gray-400">Our strict no-refunds stance</p>
        </a>

        <a href="/legal/accessibility" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Accessibility</h2>
          <p className="text-gray-600 dark:text-gray-400">Our accessibility features and limitations</p>
        </a>

        <a href="/legal/security" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Security Measures</h2>
          <p className="text-gray-600 dark:text-gray-400">How we protect our systems</p>
        </a>

        <a href="/legal/compliance" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Compliance</h2>
          <p className="text-gray-600 dark:text-gray-400">Our regulatory compliance approach</p>
        </a>

        <a href="/legal/cookie-policy" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Cookie Policy</h2>
          <p className="text-gray-600 dark:text-gray-400">How we use cookies and tracking</p>
        </a>
      </div>
    </article>
  )
} 