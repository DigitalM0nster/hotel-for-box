"use client";
import { USER_PROFILE_MENU } from "@/data/constants/menus";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function UserProfileMenu() {
    const path = usePathname();

    const menu = useMemo(
        () =>
            USER_PROFILE_MENU.map(({ name, title }) => {
                const isSelected = path.includes(name);
                const selectedBg = isSelected ? "bg-f-gray-50" : "";
                const selectedText = isSelected ? "text-f-accent" : "text-f-blue-500";

                return (
                    <Link
                        href={`/user/profile/${name}`}
                        key={name}
                        className={`${selectedBg} flex align-middle gap-2 rounded-xl p-3 
                                    
                                        `}
                    >
                        <div className={`tag ${selectedText}  self-center`}>{title}</div>
                    </Link>
                );
            }),
        [path]
    );

    return (
        <div
            className="bg-f-white-100 flex   pb-6 gap-2 self-center flex-nowrap scroll-smooth scrollbar-hide z-10 border-b-1 border-b-f-gray-200
                                    lg:bg-transparent lg:w-auto
                                    md:flex-row md:flex-nowrap md:overflow-x-auto md:whitespace-nowrap md:w-full
                                    sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:whitespace-nowrap sm:w-full 
                                    "
        >
            {menu}
        </div>
    );
}
