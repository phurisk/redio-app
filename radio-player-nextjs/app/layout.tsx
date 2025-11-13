import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Demo Radio - Web Player",
  description: "Streaming from AzuraCast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
