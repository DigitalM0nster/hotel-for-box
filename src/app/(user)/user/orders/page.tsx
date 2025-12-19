import OrdersActionsBar from "@/components/orders/OrdersActionsBar";
import { OrdersTabsControls, OrdersTabsList, OrdersTabsProvider } from "@/components/orders/OrdersTabsSection";
import { progectPathes } from "@/config/pathes";
import { getUserOrders } from "@/libs/services/orderService";
import styles from "./OrdersPage.module.scss";

export default async function OrderPage() {
	const orders = await getUserOrders();

	return (
		<OrdersTabsProvider orders={orders || []}>
			<div className={styles.ordersPage}>
				<div className={styles.headerSection}>
					<div className={styles.headerTop}>
						<div className={`h3 ${styles.title}`}>Мои заказы</div>
						<OrdersActionsBar createHref={progectPathes.ordersId.path + "new_order"} orders={orders || []} />
					</div>
					<OrdersTabsControls />
				</div>
				<OrdersTabsList />
			</div>
		</OrdersTabsProvider>
	);
}
