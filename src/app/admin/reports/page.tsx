import styles from "../AdminDashboard.module.scss";
import { REPORTS_SUBMENU } from "@/data/constants/reportsMenu";
import Link from "next/link";

// Главная страница раздела "Отчёты".
// Показывает список всех доступных отчётов.
export default function AdminReportsPage() {
	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>Выберите отчёт</div>
			<div className={styles.reportsGrid}>
				{REPORTS_SUBMENU.map(({ name, title }) => (
					<Link key={name} href={`/admin/reports/${name}`} className={styles.reportCard}>
						<div className={styles.reportCardTitle}>{title}</div>
					</Link>
				))}
			</div>
		</section>
	);
}
