import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    template: "%s | Parcare-Aeroport Otopeni",
    default: "Parcare Aeroport Otopeni - Parcare Privată Otopeni - Tarif Mic",
  },
  description:
    "Alege inteligent, alege siguranța, alege confortul. Alege Parcare Aeroport Otopeni la un tarif avantajos pentru tine!",
  keywords: [
    "parcare aeroport otopeni",
    "parcare henri coanda",
    "parcare aeroport bucuresti",
    "rezervare parcare otopeni",
    "parcare sigura aeroport",
    "transfer aeroport otopeni",
  ],
  authors: [{ name: "Parcare-Aeroport SRL" }],
  creator: "Parcare-Aeroport SRL",
  publisher: "Parcare-Aeroport SRL",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  metadataBase: new URL("https://parcare-aeroport.ro"),
  alternates: {
    canonical: "/",
    languages: {
      ro: "/",
      en: "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "https://parcare-aeroport.ro",
    title: "Parcare Aeroport Otopeni - Parcare Privată Otopeni - Tarif Mic",
    description:
      "Alege inteligent, alege siguranța, alege confortul. Alege Parcare Aeroport Otopeni la un tarif avantajos pentru tine!",
    siteName: "Parcare-Aeroport Otopeni",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Parcare-Aeroport Otopeni",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Parcare Aeroport Otopeni - Parcare Privată Otopeni - Tarif Mic",
    description:
      "Alege inteligent, alege siguranța, alege confortul. Alege Parcare Aeroport Otopeni la un tarif avantajos pentru tine!",
    images: ["/og-image.jpg"],
    creator: "@parcareaeroport",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "verificare-google",
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon.png',
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" className="scroll-smooth">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
