import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
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
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TVT24B3N');
            `,
          }}
        />
        
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TQ1MH8BPPJ"
          strategy="afterInteractive"
        />
        <Script
          id="ga4-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TQ1MH8BPPJ');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-TVT24B3N"
            height="0" 
            width="0" 
            style={{display:"none", visibility:"hidden"}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
        <Toaster />
      </body>
    </html>
  )
}
