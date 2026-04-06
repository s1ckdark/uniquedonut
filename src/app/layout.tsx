import type { Metadata } from "next";
import { Fredoka, Space_Grotesk } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "UNIQUE DONUT — Creative Demo Shop",
  description: "Fresh-baked creative demos, served hot. A pop-art portfolio of interactive web experiments.",
  openGraph: {
    title: "UNIQUE DONUT",
    description: "Fresh-baked creative demos, served hot 🍩",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bungee+Shade&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full"
        style={{ background: "#1A0A2E", color: "#FEFEFE" }}
      >
        {children}
      </body>
    </html>
  );
}
