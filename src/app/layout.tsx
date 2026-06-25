import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "RongRuen IoT",
    template: "%s | RongRuen IoT",
  },
  description:
    "A performance-focused smart farm monitoring dashboard for sensor and weather telemetry.",
  applicationName: "RongRuen IoT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
