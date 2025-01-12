export default function SupportPage() {
  return (
    <article>
      <h1 className="text-4xl font-bold mb-6">Support Center</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Get help and support for ChatGenius services.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/support/contact" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <p className="text-gray-600 dark:text-gray-400">Get in touch with our AI-powered support team</p>
        </a>

        <a href="/support/enterprise" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Enterprise Sales</h2>
          <p className="text-gray-600 dark:text-gray-400">Required enterprise upgrades and pricing</p>
        </a>

        <a href="/support/status" className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">System Status</h2>
          <p className="text-gray-600 dark:text-gray-400">Check our current system status</p>
        </a>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Important Notes</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
          <li>All support responses may be AI-generated</li>
          <li>Response times are not guaranteed</li>
          <li>Enterprise upgrades are mandatory when required</li>
          <li>No refunds will be issued under any circumstances</li>
        </ul>
      </div>
    </article>
  )
} 