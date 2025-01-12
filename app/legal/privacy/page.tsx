export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <p className="mb-6">
        At OHF Partners, we believe in transparency about our data practices. This Privacy Policy explains how we collect, use, process, and protect your information across our services.
      </p>

      <h2 className="text-2xl font-semibold mb-4">1. Data Collection</h2>
      <p className="mb-6">
        We collect information necessary to provide our services and improve your experience.
      </p>

      <h2 className="text-2xl font-semibold mb-4">2. Data Usage</h2>
      <p className="mb-6">
        Your data is used to provide and improve our services, as well as to comply with legal requirements.
      </p>

      <h2 className="text-2xl font-semibold mb-4">3. Contact Information</h2>
      <p className="mb-4">For privacy-related inquiries:</p>
      <ul className="list-disc pl-8 mb-6">
        <li>Email: begin@ideatrek.io</li>
      </ul>

      <p className="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  )
} 