import '../styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

export const metadata = {
  title: 'OHF Partners',
  description: 'Elite community platform for teams',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '32x32',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any'
      },
      {
        url: '/apple-touch-icon.png',
        type: 'image/png',
        sizes: '180x180'
      },
    ],
    shortcut: '/favicon.ico',
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}
