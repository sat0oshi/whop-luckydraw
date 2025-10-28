import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "WHOP Lucky Draw",
  description: "Tirage au sort Whop — Prod safe",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
