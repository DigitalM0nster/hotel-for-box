import { auth } from "@/auth";
import { redirect } from "next/navigation";
import styles from "@/app/admin/AdminDashboard.module.scss";
import { getOrderById } from "@/libs/services/orderService";
import AdminOrderView from "@/components/admin/AdminOrderView";

type AdminOrderPageProps = {
	params: Promise<{
		id: string;
	}>;
	searchParams: Promise<{
		tab?: string;
	}>;
};

// Страница карточки заказа в админке.
// Здесь мы на сервере проверяем права и загружаем заказ, а саму верстку отдаём в AdminOrderView.
export default async function AdminOrderPage(props: AdminOrderPageProps) {
	// В Next.js 15 params и searchParams приходят как Promise,
	// поэтому сначала "достаём" их и только потом используем.
	const [session, { id }, { tab }] = await Promise.all([auth(), props.params, props.searchParams]);

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Заказ</div>
					<div>Доступ к карточке заказа есть только у администратора.</div>
				</section>
			</div>
		);
	}

	const orderId = id;
	const order = await getOrderById(orderId);

	if (!order) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Заказ</div>
					<div>Заказ не найден. Проверьте номер заказа или ID.</div>
				</section>
			</div>
		);
	}

	// Если заказ открыт по Mongo _id, но у него есть orderId (человекочитаемый ID),
	// перенаправляем на правильный URL с orderId.
	// Это нужно, чтобы в URL всегда был красивый числовой ID, а не кракозябра.
	if (order.orderId && id !== order.orderId) {
		const redirectUrl = tab === "history" ? `/admin/orders/${order.orderId}?tab=history` : `/admin/orders/${order.orderId}`;
		redirect(redirectUrl);
	}

	const activeTab = tab === "history" ? "history" : "details";

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<AdminOrderView order={order} activeTab={activeTab} />
			</section>
		</div>
	);
}
