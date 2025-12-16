import UserLayout from "@/layouts/UserLayout/UserLayout";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <UserLayout>{children}</UserLayout>;
}
