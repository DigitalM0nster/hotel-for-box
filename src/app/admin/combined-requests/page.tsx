import { getCombinedOrders } from "@/libs/services/orderService";
import AdminCombinedOrdersList from "@/components/admin/AdminCombinedOrdersList";
import styles from "../AdminDashboard.module.scss";

export default async function AdminCombinedRequestsPage() {
	const groups = await getCombinedOrders();

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Объединенные заказы</div>
				<AdminCombinedOrdersList groups={groups} />
			</section>
		</div>
	);
}
