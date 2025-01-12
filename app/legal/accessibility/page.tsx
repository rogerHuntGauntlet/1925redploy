export default function Accessibility() {
  return (
    <article>
      <h1>Accessibility</h1>
      <p className="text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Our Commitment</h2>
      <p>
        We are committed to making our platform accessible to everyone, including users with disabilities. We strive to meet WCAG 2.1 Level AA standards.
      </p>

      <h2>2. Accessibility Features</h2>
      <p>
        Our platform includes the following accessibility features:
      </p>
      <ul>
        <li>Keyboard navigation support</li>
        <li>Screen reader compatibility</li>
        <li>High contrast mode</li>
        <li>Text resizing options</li>
        <li>Alt text for images</li>
        <li>ARIA labels and landmarks</li>
      </ul>

      <h2>3. Ongoing Improvements</h2>
      <p>
        We continuously work to improve our accessibility:
      </p>
      <ul>
        <li>Regular accessibility audits</li>
        <li>User feedback incorporation</li>
        <li>Compliance monitoring</li>
        <li>Staff training</li>
      </ul>

      <h2>4. Feedback and Support</h2>
      <p>
        If you encounter any accessibility issues or have suggestions for improvement, please contact our accessibility team at accessibility@chatgenius.com.
      </p>

      <p className="mt-8 text-sm text-gray-500">
        We value your feedback and are committed to making our platform accessible to all users. Thank you for helping us improve.
      </p>
    </article>
  );
} 