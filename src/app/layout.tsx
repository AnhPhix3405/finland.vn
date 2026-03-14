import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Initialize Inter font to use via CSS variable
const inter = Inter({ subsets: ["latin", "vietnamese"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "finland.vn - Bất động sản & Quy hoạch",
  description: "Nền tảng tra cứu thông tin quy hoạch và dự án bất động sản uy tín hàng đầu tại Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-display antialiased text-base`}>
        {children}
      </body>
    </html>
  );
}
