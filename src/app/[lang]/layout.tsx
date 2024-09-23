import localFont from "next/font/local"; 
import { i18n } from "@/i18n-config";
import "./globals.css";
import { GoogleAdScript } from "./googleads-script";
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
      <head>
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5272446316143834" crossOrigin="anonymous"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main>{children}</main>
      <GoogleAdScript />
      </body>
    </html>
  );
}
