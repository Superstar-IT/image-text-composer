import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Image Text Composer',
  description: 'A desktop image editing tool for adding customizable text overlays to PNG images',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Lato:wght@100;300;400;700;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Source+Sans+Pro:wght@200;300;400;600;700;900&family=Ubuntu:wght@300;400;500;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=PT+Sans:wght@400;700&family=Noto+Sans:wght@100;200;300;400;500;600;700;800;900&family=Oswald:wght@200;300;400;500;600;700&family=Roboto+Condensed:wght@300;400;700&family=Slabo+27px&family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&family=Open+Sans+Condensed:wght@300;700&family=Source+Code+Pro:wght@200;300;400;500;600;700;800;900&family=Inconsolata:wght@200;300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&family=Quicksand:wght@300;400;500;600;700&family=Josefin+Sans:wght@100;200;300;400;500;600;700&family=Abel&family=Anton&family=Bebas+Neue&family=Comfortaa:wght@300;400;500;600;700&family=Fredoka+One&family=Indie+Flower&family=Lobster&family=Pacifico&family=Permanent+Marker&family=Righteous&family=Satisfy&family=Shadows+Into+Light&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}






