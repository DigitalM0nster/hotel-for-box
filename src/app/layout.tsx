import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/tailwind.css";
import "@/styles/globals.scss";
import { ToastContainer } from "react-toastify";

import "react-phone-input-2/lib/style.css";

const interFont = Inter({
    variable: "--font-inter",
    weight: ["500", "600", "700", "800"],
    subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
    title: "Hotel4box",
    description: "Hotel4box",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${interFont.variable}  antialiased`}>
                <ToastContainer />
                {children}
            </body>
        </html>
    );
}
