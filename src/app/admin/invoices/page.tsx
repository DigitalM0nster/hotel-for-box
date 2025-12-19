import styles from "../AdminDashboard.module.scss";

export default function AdminInvoicesPage() {
	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Счета</div>
				<div>Здесь будет список счетов, статусы оплаты и детали по каждому счету.</div>
			</section>
		</div>
	);
}
