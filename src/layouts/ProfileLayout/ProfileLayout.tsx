import UserInfo from "@/components/common/UserInfo/UserInfo";

import UserProfileMenu from "@/components/html/UserProfileMenu/UserProfileMenu";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <UserInfo
                className="box items-center bg-f-gray-30 mx-4 my-5
                            md:mx-6
                            lg:hidden
                            "
            />

            <UserProfileMenu />
            <div className="w-full h-full py-8">{children}</div>
        </div>
    );
}
