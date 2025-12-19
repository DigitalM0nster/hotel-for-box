import styles from "../AdminDashboard.module.scss";

export default function AdminSettingsPage() {
	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Настройки</div>
				<div>Здесь будут общие настройки проекта и админ-панели.</div>
			</section>
		</div>
	);
}
