import type { Metadata } from "next";
import { Geist, Geist_Mono, Merriweather, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merriweather = Merriweather({ weight: ["300","400","700","900"], subsets: ["latin"], variable: "--font-merriweather" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ZeroWriter",
  description: "AI-assisted writing workspace for drafting books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
