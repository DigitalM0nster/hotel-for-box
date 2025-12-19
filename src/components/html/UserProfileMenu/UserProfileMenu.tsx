"use client";
import { USER_PROFILE_MENU } from "@/data/constants/menus";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import styles from "./UserProfileMenu.module.scss";

export default function UserProfileMenu() {
	const path = usePathname();

	// выбираем активный сегмент из пути; если сегмента нет, берём первый пункт
	const selectedName = useMemo(() => {
		const pathSegments = path.split("/").filter(Boolean);
		const currentSegment = pathSegments[pathSegments.length - 1];
		const matchedItem = USER_PROFILE_MENU.find(({ name }) => currentSegment === name);
		return matchedItem?.name ?? USER_PROFILE_MENU[0].name;
	}, [path]);

	const menu = useMemo(
		() =>
			USER_PROFILE_MENU.map(({ name, title }) => {
				const isSelected = selectedName === name;

				return (
					<Link href={`/user/profile/${name}`} key={name} className={`${styles.menuItem} ${isSelected ? styles.menuItemSelected : styles.menuItemDefault}`}>
						<div className={`tag ${isSelected ? styles.menuTitleSelected : styles.menuTitleDefault}`}>{title}</div>
					</Link>
				);
			}),
		[path, selectedName]
	);

	return <div className={styles.menuWrapper}>{menu}</div>;
}
