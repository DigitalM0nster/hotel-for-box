"use client";

import { signOut } from "@/auth";
import { getPageTitle, progectPathes } from "@/config/pathes";
import { ArrowLEftIco, ExitIco } from "@/icons/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function BackPageInfoPanel() {
    const path = usePathname();
    progectPathes;

    if (!path) return false;

    const backPage = useMemo(() => getPageTitle(path), [path]);

    if (backPage.path === "/") return false;

    return (
        <div className="flex gap-1 justify-between items-center  pb-8     lg:justify-start lg:pb-14">
            <Link href={backPage.path} className="flex gap-2 items-center ">
                <ArrowLEftIco className="cursor-pointer **:fill-f-blue-950 lg:*:fill-f-blue-500" />
            </Link>

            <Link href={backPage.path}>
                <div className="h3 text-f-blue-950 lg:hidden">{backPage.title}</div>
            </Link>
            <Link href={backPage.path} className="body-2 text-f-blue-500 hidden lg:block ">
                <div>{backPage.title}</div>
            </Link>

            <Link
                className="lg:hidden"
                href={"/"}
                onClick={() => {
                    signOut({ redirectTo: "/" });
                }}
            >
                <ExitIco />
            </Link>
        </div>
    );
}
