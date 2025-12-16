"use client";

import UserInfo from "@/components/common/UserInfo/UserInfo";
import Link from "next/link";

import Exit from "@/assets/svg/exit.svg";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { IUserMenuItem } from "../../../types/types";
import { USER_ASIDE_MENU_ITEMS, USER_FOOTER_MENU_ITEMS } from "@/data/constants/menus";
import { signOut } from "next-auth/react";

export function UserAsideLinkMenu() {
    const path = usePathname();
    const menuHtml = useMemo(
        () =>
            USER_ASIDE_MENU_ITEMS.map(({ Ico, name, title }) => {
                const isSelected = path.includes(name);
                return (
                    <Link
                        key={name}
                        href={`/user/${name}`}
                        className={`${
                            isSelected ? "bg-f-white-100" : "bg-transparent"
                        } rounded-[16px] flex gap-4 py-6 px-8 cursor-pointer`}
                    >
                        <div>
                            <Ico
                                className={isSelected ? "**:fill-f-accent" : "**:fill-f-blue-500"}
                            />
                        </div>
                        <div
                            className={`button-2 ${
                                isSelected ? "text-f-accent" : "text-f-blue-950"
                            } w-full`}
                        >
                            {title}
                        </div>
                    </Link>
                );
            }),
        [path]
    );
    return (
        <aside>
            {menuHtml}
            <Link
                href={"/"}
                className="bg-transparent rounded-[16px] flex gap-4 py-6 px-8 cursor-pointer"
            >
                <div>
                    <Exit className="**:fill-f-blue-500" />
                </div>
                <div
                    className="button-2 text-f-blue-950 w-full"
                    onClick={() => {
                        signOut({ redirectTo: "/" });
                    }}
                >
                    Выйти
                </div>
            </Link>
        </aside>
    );
}

export function UserFooterLinkMenu() {
    const path = usePathname();
    const menuHtml = useMemo(
        () =>
            USER_FOOTER_MENU_ITEMS.map(({ Ico, name, title }) => {
                const isSelected = path.includes(name);
                return (
                    <Link
                        key={name}
                        href={`/user/${name}`}
                        className="flex flex-col items-center gap-0.5 "
                    >
                        {isSelected && (
                            <div className="absolute top-0 bg-f-accent h-0.5 w-6 rounded-b-md"></div>
                        )}
                        <div>
                            <Ico
                                className={isSelected ? "**:fill-f-accent" : "**:fill-f-blue-500"}
                            />
                        </div>
                        <div
                            className={`button-2 ${
                                isSelected ? "text-f-accent" : "text-f-blue-950"
                            } w-full`}
                        >
                            {title}
                        </div>
                    </Link>
                );
            }),
        [path]
    );
    return <>{menuHtml}</>;
}
