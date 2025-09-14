import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Guide48",
  description: "A safety-first hike planner for the NH 4000-footers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${serif.variable} antialiased bg-parchment text-ink`}
      >
        {/* Header banner */}
        <header className="relative h-40 md:h-48 w-full overflow-hidden bg-[url('/map-banner.jpg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-black/10" />
          <div className="relative h-full max-w-6xl mx-auto flex items-end px-4 pb-4">
            <h1 className="text-3xl md:text-4xl font-display text-amber-100 drop-shadow">
              Go for a Hike!
            </h1>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

        <footer className="max-w-6xl mx-auto px-4 py-6 text-xs text-ink/70">
          ⚠️ This is guidance, not a guarantee. You are responsible for your decisions.
        </footer>
      </body>
    </html>
  );
}

