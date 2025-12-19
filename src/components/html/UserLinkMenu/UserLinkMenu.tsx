"use client";
import Link from "next/link";

import Exit from "@/assets/svg/exit.svg";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { USER_ASIDE_MENU_ITEMS, USER_FOOTER_MENU_ITEMS } from "@/data/constants/menus";
import { signOut } from "next-auth/react";
import styles from "./UserLinkMenu.module.scss";

export function UserAsideLinkMenu() {
	const path = usePathname();
	const menuHtml = useMemo(
		() =>
			USER_ASIDE_MENU_ITEMS.map(({ Ico, name, title }) => {
				const isSelected = path.includes(name);
				return (
					<Link key={name} href={`/user/${name}`} className={`${styles.asideMenuItem} ${isSelected ? styles.asideMenuItemSelected : styles.asideMenuItemDefault}`}>
						<div>
							<Ico className={isSelected ? styles.asideMenuIconSelected : styles.asideMenuIcon} />
						</div>
						<div className={`${styles.asideMenuTitle} ${isSelected ? styles.asideMenuTitleSelected : styles.asideMenuTitleDefault}`}>{title}</div>
					</Link>
				);
			}),
		[path]
	);
	return (
		<aside>
			{menuHtml}
			<Link href={"/"} className={`${styles.asideMenuItem} ${styles.asideMenuItemDefault}`}>
				<div>
					<Exit className={styles.asideMenuIcon} />
				</div>
				<div
					className={`${styles.asideMenuTitle} ${styles.asideMenuTitleDefault}`}
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
					<Link key={name} href={`/user/${name}`} className={styles.footerMenuItem}>
						{isSelected && <div className={styles.footerMenuIndicator}></div>}
						<div>
							<Ico className={isSelected ? styles.footerMenuIconSelected : styles.footerMenuIcon} />
						</div>
						<div className={`${styles.footerMenuTitle} ${isSelected ? styles.footerMenuTitleSelected : styles.footerMenuTitleDefault}`}>{title}</div>
					</Link>
				);
			}),
		[path]
	);
	return <>{menuHtml}</>;
}
