import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Lucidly TeamDesk",
  description: "Lock in. Ship daily. Everyone sees everything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
