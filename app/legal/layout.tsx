export const metadata = {
  title: 'Legal | OHF Partners',
  description: 'Legal documents and policies for OHF Partners, a product of Idea Trek LLC',
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </div>
  )
} 