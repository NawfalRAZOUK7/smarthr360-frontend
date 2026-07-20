import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "SmartHR360",
  description: "HR Analytics Suite — decision support, predictions, interoperability",
};

// Applied before paint to avoid a theme flash.
const themeInit = `
(function () {
  try {
    var t = localStorage.getItem("shr360.theme");
    if (!t) t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      {/* suppressHydrationWarning: extensions like Grammarly inject attributes into <body> */}
      <body className="antialiased" suppressHydrationWarning>
        <div className="aurora" aria-hidden />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
