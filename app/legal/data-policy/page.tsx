export default function DataPolicy() {
  return (
    <article>
      <h1>Data Policy</h1>
      <p className="text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Data Collection</h2>
      <p>
        We collect and process various types of data to provide and improve our services:
      </p>
      <ul>
        <li>User account information</li>
        <li>Communication data</li>
        <li>Usage statistics</li>
        <li>Technical information</li>
      </ul>

      <h2>2. Data Usage</h2>
      <p>
        Your data is used to:
      </p>
      <ul>
        <li>Provide core messaging functionality</li>
        <li>Improve user experience</li>
        <li>Maintain service security</li>
        <li>Comply with legal requirements</li>
      </ul>

      <h2>3. Data Protection</h2>
      <p>
        We implement industry-standard security measures to protect your data:
      </p>
      <ul>
        <li>End-to-end encryption for messages</li>
        <li>Secure data storage</li>
        <li>Regular security audits</li>
        <li>Access controls</li>
      </ul>

      <p className="mt-8 text-sm text-gray-500">
        For more information about how we handle your data, please refer to our Privacy Policy.
      </p>
    </article>
  );
} 