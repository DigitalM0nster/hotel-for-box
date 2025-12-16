import ProfileLayout from "@/layouts/ProfileLayout/ProfileLayout";
import UserLayout from "@/layouts/UserLayout/UserLayout";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <ProfileLayout>{children}</ProfileLayout>;
    return children;
}
