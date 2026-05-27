import type { Metadata } from "next";
// import { Inter, Poppins, Modak } from "next/font/google";
import "./styles/globals.css";
import "./styles/emoji-picker.css";
import Providers from "./Providers";
import AuthBootstrap from "./AuthBootstrap";
import { inter, poppins } from "@/utils/fonts";

export const metadata: Metadata = {
  title: "Convy",
  description: "Conversations made simple",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <Providers>
          <AuthBootstrap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
