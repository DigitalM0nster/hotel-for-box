import { auth } from "@/auth";
import FlightForm from "@/components/forms/flightForm";
import styles from "../../../AdminDashboard.module.scss";

export default async function AdminFlightsNewPage() {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Создание рейса</div>
					<div>Доступ к созданию рейсов есть только у администратора.</div>
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Создание рейса</div>
				<FlightForm flight={null} redirectTo="/admin/reports/flights" />
			</section>
		</div>
	);
}
