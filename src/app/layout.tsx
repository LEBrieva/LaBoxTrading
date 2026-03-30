import type { Metadata, Viewport } from "next";
import { Rajdhani, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "La Trading Box — Trading Journal",
  description: "Tu journal de trading personal. Registrá operaciones, analizá estadísticas, seguí tu equity curve y mejorá tu rendimiento.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tradingbox.app"),
  openGraph: {
    title: "La Trading Box",
    description: "Tu journal de trading personal. Registrá operaciones, analizá estadísticas y mejorá tu rendimiento.",
    type: "website",
    locale: "es_AR",
    siteName: "La Trading Box",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "La Trading Box" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "La Trading Box",
    description: "Tu journal de trading personal. Registrá operaciones, analizá estadísticas y mejorá tu rendimiento.",
    images: ["/og-image.png"],
  },
  icons: { icon: "/icon.png" },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${rajdhani.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
