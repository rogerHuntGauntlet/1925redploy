export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">General Inquiries</h2>
          <p className="mb-4">For any general questions or support:</p>
          <ul className="list-disc pl-8">
            <li>Email: begin@ideatrek.io</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Technical Support</h2>
          <p className="mb-4">For technical issues or platform-related questions:</p>
          <ul className="list-disc pl-8">
            <li>Email: begin@ideatrek.io</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Security</h2>
          <p className="mb-4">For security-related concerns or to report vulnerabilities:</p>
          <ul className="list-disc pl-8">
            <li>Email: begin@ideatrek.io</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Media Inquiries</h2>
          <p className="mb-4">For press and media related questions:</p>
          <ul className="list-disc pl-8">
            <li>Email: begin@ideatrek.io</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Office Location</h2>
          <p className="mb-4">OHF Partners Headquarters:</p>
          <address className="not-italic pl-8">
            Contact us at begin@ideatrek.io for office details
          </address>
        </section>
      </div>

      <p className="text-sm text-gray-500 mt-8">
        Response Time: We aim to respond to all inquiries within 24 business hours.
      </p>
    </div>
  )
} 