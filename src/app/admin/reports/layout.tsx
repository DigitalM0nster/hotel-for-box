import { ReactNode } from "react";
import ReportsSubmenu from "@/components/admin/ReportsSubmenu";
import styles from "../AdminDashboard.module.scss";

// Layout для раздела "Отчёты".
// Добавляет меню подразделов ко всем страницам внутри /admin/reports.
export default function ReportsLayout({ children }: { children: ReactNode }) {
	return (
		<div className={styles.cardsColumn}>
			{/* Заголовок раздела */}
			<div className={styles.pageTitle}>Отчёты</div>

			{/* Меню подразделов */}
			<ReportsSubmenu />

			{/* Контент конкретного отчёта */}
			{children}
		</div>
	);
}
