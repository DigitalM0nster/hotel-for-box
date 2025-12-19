"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/AdminDashboard.module.scss";

// Импорт SVG иконок для меню
import DashboardIcon from "@/assets/svg/dashboard.svg";
import AdminUsersIcon from "@/assets/svg/admin-users.svg";
import AdminOrdersIcon from "@/assets/svg/admin-orders.svg";
import CombinedOrdersIcon from "@/assets/svg/combined-orders.svg";
import AdminBranchesIcon from "@/assets/svg/admin-branches.svg";
import ReportsIcon from "@/assets/svg/reports.svg";
import InvoicesIcon from "@/assets/svg/invoices.svg";
import AdminPagesIcon from "@/assets/svg/admin-pages.svg";
import SettingsIcon from "@/assets/svg/settings.svg";

type AdminMenuItem = {
	label: string;
	href: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

// Пункты меню с иконками
const adminMenuItems: AdminMenuItem[] = [
	{ label: "Панель управления", href: "/admin", icon: DashboardIcon },
	{ label: "Пользователи", href: "/admin/users", icon: AdminUsersIcon },
	{ label: "Заказы", href: "/admin/orders", icon: AdminOrdersIcon },
	{ label: "Объединенные заказы", href: "/admin/combined-requests", icon: CombinedOrdersIcon },
	{ label: "Отделения", href: "/admin/branches", icon: AdminBranchesIcon },
	{ label: "Отчеты", href: "/admin/reports", icon: ReportsIcon },
	{ label: "Счета", href: "/admin/invoices", icon: InvoicesIcon },
	{ label: "Страницы", href: "/admin/pages", icon: AdminPagesIcon },
	{ label: "Настройки", href: "/admin/settings", icon: SettingsIcon },
];

// Меню админ-панели: отдельный компонент, использует Link и подсвечивает активный роут.
export default function AdminSidebar() {
	const pathname = usePathname();

	return (
		<aside className={styles.sidebar}>
			<div className={styles.logo}>Hotel4box</div>

			<div className={styles.userInfo}>
				<div className={styles.userName}>Hi, AdminName</div>
				<div className={styles.userStatus}>IP: 127.0.0.1 | Points: 50.00</div>
			</div>

			<nav className={styles.menu}>
				{adminMenuItems.map((item) => {
					const isActive = pathname === item.href;
					const IconComponent = item.icon;
					return (
						<Link key={item.href} href={item.href} className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}>
							<IconComponent className={styles.menuItemIcon} aria-hidden />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
