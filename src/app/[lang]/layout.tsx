import localFont from "next/font/local"; 
import { i18n } from "@/i18n-config";
import "./globals.css";




export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}
// export const metadata: Metadata = {
//   title: getDictionary,
//   description: '...',
// }

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
