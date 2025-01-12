export default function CookiePolicy() {
  return (
    <article>
      <h1>Cookie Policy</h1>
      <p className="text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by:
      </p>
      <ul>
        <li>Remembering your preferences</li>
        <li>Keeping you signed in</li>
        <li>Understanding how you use our service</li>
        <li>Improving our platform based on your behavior</li>
      </ul>

      <h2>2. Types of Cookies We Use</h2>
      <p>
        We use the following types of cookies:
      </p>
      <ul>
        <li>Essential cookies - Required for basic functionality</li>
        <li>Functional cookies - Remember your preferences</li>
        <li>Analytics cookies - Help us understand usage patterns</li>
        <li>Marketing cookies - Help us deliver relevant content</li>
      </ul>

      <h2>3. Managing Cookies</h2>
      <p>
        You can control cookies through your browser settings:
      </p>
      <ul>
        <li>Block all cookies</li>
        <li>Delete existing cookies</li>
        <li>Allow cookies from specific sites</li>
        <li>Set cookie preferences</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>
        Some of our pages may contain cookies from third-party services:
      </p>
      <ul>
        <li>Analytics providers</li>
        <li>Social media platforms</li>
        <li>Advertising networks</li>
        <li>Security services</li>
      </ul>

      <p className="mt-8 text-sm text-gray-500">
        By using our service, you consent to the use of cookies as described in this policy. For more information about how we handle your data, please refer to our Privacy Policy.
      </p>
    </article>
  );
} 