import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Playground — Create, Play & Remix AI Mini-Apps",
  description: "A community platform to build, test, verify, and remix interactive web mini-apps with Gemini AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(l){if(l.search[1]==='/'){var decoded=l.search.slice(1).split('&').map(function(s){return s.replace(/~and~/g,'&')}).join('?');window.history.replaceState(null,null,l.pathname.slice(0,-1)+decoded+l.hash);}})(window.location);`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fbfbfa] text-slate-900 selection:bg-indigo-100 selection:text-indigo-800">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
