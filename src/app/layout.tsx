import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "WHOP Lucky Draw",
  description: "Server-side raffle for Whop communities",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
