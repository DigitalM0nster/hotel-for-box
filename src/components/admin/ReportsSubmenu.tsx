"use client";

import { REPORTS_SUBMENU } from "@/data/constants/reportsMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import styles from "./ReportsSubmenu.module.scss";

// Компонент меню подразделов для раздела "Отчёты".
// Показывает список всех доступных отчётов и подсвечивает активный.
export default function ReportsSubmenu() {
	const pathname = usePathname();

	// Определяем активный подраздел по текущему пути
	const activeSubmenu = useMemo(() => {
		const pathSegments = pathname.split("/").filter(Boolean);
		// Если путь /admin/reports или /admin/reports/, то активного подраздела нет
		if (pathSegments.length <= 2 || pathSegments[1] !== "reports") {
			return null;
		}
		// Если есть третий сегмент - это подраздел
		if (pathSegments.length >= 3) {
			return pathSegments[2];
		}
		return null;
	}, [pathname]);

	return (
		<nav className={styles.reportsSubmenu}>
			{REPORTS_SUBMENU.map(({ name, title }) => {
				const isActive = activeSubmenu === name;
				return (
					<Link key={name} href={`/admin/reports/${name}`} className={`${styles.submenuItem} ${isActive ? styles.submenuItemActive : ""}`}>
						{title}
					</Link>
				);
			})}
		</nav>
	);
}
