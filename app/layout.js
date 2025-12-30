import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Judge Score Pro | Real-time Competition Scoring",
  description: "A professional, real-time competition scoring management system. perfect for dance, music, and talent show judging.",
  keywords: ["judge scoring", "live leaderboard", "real-time results", "competition management", "talent show scoring", "professional judging app"],
  authors: [{ name: "Judge Score Pro Team" }],
  openGraph: {
    title: "Judge Score Pro",
    description: "Manage your competition scoring with real-time accuracy and professional PDF reporting.",
    type: "website",
  }
};


export default function RootLayout({ children }) {
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
