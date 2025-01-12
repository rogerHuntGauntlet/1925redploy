export default function Security() {
  return (
    <article>
      <h1>Security</h1>
      <p className="text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Security Commitment</h2>
      <p>
        We are committed to protecting your data and communications with industry-leading security measures:
      </p>
      <ul>
        <li>End-to-end encryption for all messages</li>
        <li>Secure data storage and transmission</li>
        <li>Regular security audits and penetration testing</li>
        <li>Compliance with international security standards</li>
      </ul>

      <h2>2. Infrastructure Security</h2>
      <p>
        Our infrastructure is protected by:
      </p>
      <ul>
        <li>Multi-layer firewalls</li>
        <li>DDoS protection</li>
        <li>24/7 monitoring</li>
        <li>Automated threat detection</li>
      </ul>

      <h2>3. Account Security</h2>
      <p>
        We provide several features to keep your account secure:
      </p>
      <ul>
        <li>Two-factor authentication</li>
        <li>Login alerts</li>
        <li>Session management</li>
        <li>Strong password requirements</li>
      </ul>

      <h2>4. Reporting Security Issues</h2>
      <p>
        If you discover a security vulnerability, please report it to our security team immediately at security@chatgenius.com.
      </p>

      <p className="mt-8 text-sm text-gray-500">
        We continuously update our security measures to protect against new threats. For more details about our security practices, please contact our security team.
      </p>
    </article>
  );
} 