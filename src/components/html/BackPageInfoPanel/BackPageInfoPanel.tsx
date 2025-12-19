"use client";

import { signOut } from "@/auth";
import { getPageTitle, progectPathes } from "@/config/pathes";
import { ArrowLEftIco, ExitIco } from "@/icons/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import styles from "./BackPageInfoPanel.module.scss";

export default function BackPageInfoPanel() {
	const path = usePathname();
	progectPathes;

	if (!path) return false;

	const backPage = useMemo(() => getPageTitle(path), [path]);

	if (backPage.path === "/") return false;

	return (
		<div className={styles.backPanelWrapper}>
			<Link href={backPage.path} className={styles.backLink}>
				<ArrowLEftIco className={styles.backIcon} />
			</Link>

			<Link href={backPage.path}>
				<div className={styles.mobileTitle}>{backPage.title}</div>
			</Link>
			<Link href={backPage.path} className={styles.desktopTitle}>
				<div className="body-2 text-f-blue-500">{backPage.title}</div>
			</Link>

			<Link
				className={styles.exitLink}
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
