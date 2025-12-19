import styles from "../AdminDashboard.module.scss";

export default function AdminPagesPage() {
	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Страницы</div>
				<div>Здесь будет управление статическими страницами сайта.</div>
			</section>
		</div>
	);
}
