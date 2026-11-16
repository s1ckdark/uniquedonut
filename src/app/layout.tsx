import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
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
