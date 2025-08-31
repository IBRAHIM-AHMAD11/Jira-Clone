import type { Metadata } from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Project Management App",
  description: "A simple project management application built with Next.js and Appwrite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(inter.className, "antialiased min-h-screen")}
      >
        <QueryProvider>
          <Toaster />
          {children}
        </QueryProvider>  
      </body>
    </html>
  );
}
