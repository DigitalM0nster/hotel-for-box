import HomeLayout from "@/layouts/HomeLayout/HomeLayout";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <HomeLayout>{children}</HomeLayout>;
}
