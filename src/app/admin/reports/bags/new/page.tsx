import { auth } from "@/auth";
import BagForm from "@/components/forms/bagForm";
import styles from "../../../AdminDashboard.module.scss";

export default async function AdminBagsNewPage() {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Создание сумки</div>
					<div>Доступ к созданию сумок есть только у администратора.</div>
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Создание сумки</div>
				<BagForm bag={null} redirectTo="/admin/reports/bags" />
			</section>
		</div>
	);
}
