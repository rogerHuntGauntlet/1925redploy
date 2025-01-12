export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
      
      <p className="mb-6">
        Welcome to OHF Partners, a product of Idea Trek LLC. By accessing or using our service, you agree to be bound by these Terms and Conditions.
      </p>

      <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
      <p className="mb-6">
        By accessing or using OHF Partners, you agree to these terms and all applicable laws and regulations.
      </p>

      <h2 className="text-2xl font-semibold mb-4">2. Licensing</h2>
      <p className="mb-6">
        2.1. One-Time Payment License: Upon payment of $1,000, users receive a lifetime access license to OHF Partners, subject to the terms and limitations outlined herein. All payments are processed through Idea Trek LLC.
      </p>

      <p className="mb-6">
        2.2. Enterprise Licensing: OHF Partners reserves the right to require users to upgrade to an Enterprise License based on:
      </p>

      <ul className="list-disc pl-8 mb-6">
        <li>Usage volume and patterns</li>
        <li>Number of active users</li>
        <li>Storage requirements</li>
        <li>Support needs</li>
        <li>Compliance requirements</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">3. Contact Information</h2>
      <ul className="list-disc pl-8 mb-6">
        <li>Company: Idea Trek LLC</li>
        <li>Product: OHF Partners</li>
        <li>Email: legal@ohfpartners.com</li>
      </ul>

      <p className="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  )
} 