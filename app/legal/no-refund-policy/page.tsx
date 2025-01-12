export default function NoRefundPolicy() {
  return (
    <article>
      <h1>No Refund Policy</h1>
      <p className="text-gray-600 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Policy Overview</h2>
      <p>
        ChatGenius maintains a strict no-refund policy for all purchases and subscriptions. All sales are final.
      </p>

      <h2>2. Scope of Policy</h2>
      <p>
        This policy applies to:
      </p>
      <ul>
        <li>One-time purchases</li>
        <li>Subscription payments</li>
        <li>Enterprise licenses</li>
        <li>Add-on features</li>
      </ul>

      <h2>3. Reasons for No Refunds</h2>
      <p>
        We do not provide refunds for:
      </p>
      <ul>
        <li>Change of mind</li>
        <li>Accidental purchases</li>
        <li>Unused services</li>
        <li>Service dissatisfaction</li>
        <li>Technical issues</li>
        <li>Account termination</li>
      </ul>

      <h2>4. Enterprise Upgrades</h2>
      <p>
        For mandatory enterprise upgrades:
      </p>
      <ul>
        <li>Original purchase remains non-refundable</li>
        <li>Enterprise fees are non-refundable</li>
        <li>Upgrade requirements are non-negotiable</li>
      </ul>

      <h2>5. Service Termination</h2>
      <p>
        In the event of service termination:
      </p>
      <ul>
        <li>No partial refunds will be issued</li>
        <li>Remaining subscription time is forfeit</li>
        <li>All associated fees are non-refundable</li>
      </ul>

      <p className="mt-8 text-sm text-gray-500">
        By making a purchase, you acknowledge and agree to this no-refund policy. For any questions about this policy, please contact our support team.
      </p>
    </article>
  );
} 