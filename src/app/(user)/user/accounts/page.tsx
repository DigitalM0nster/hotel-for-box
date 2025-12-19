import Link from "next/link";
import { getUserOrders } from "@/libs/services/orderService";
import { IOrder } from "@/mongodb/models/orderModel";
import ordersListStyles from "@/components/lists/OrdersList/OrdersList.module.scss";
import styles from "./AccountsPage.module.scss";

// Страница "Счета": показываем все выставленные счета по заказам пользователя.
// Берём данные только с бэкенда (server component), без тестовых таблиц и tailwind.
export default async function AccountsPage() {
	// Загружаем все заказы текущего пользователя
	const orders = ((await getUserOrders()) || []) as IOrder[];

	// Фильтруем только те заказы, по которым админ выставил счёт (есть стоимость доставки)
	const invoices = orders.filter((order) => typeof order.order_coast === "number" && !Number.isNaN(order.order_coast));

	// Вспомогательная функция для статуса оплаты по счёту
	const getInvoiceStatus = (order: IOrder) => {
		if (typeof order.paid === "number" && order.paid > 0) {
			if (order.order_coast != null && order.paid >= order.order_coast) return "Счёт оплачен";
			return "Оплачен частично";
		}
		return "Счёт не оплачен";
	};

	return (
		<div className={styles.accountsPage}>
			<div className={styles.headerSection}>
				<div className={styles.headerTop}>
					<div className={`h3 ${styles.title}`}>Счета</div>
				</div>
			</div>

			<div className={styles.invoicesBox}>
				{!invoices.length ? (
					<div className={ordersListStyles.emptyWrapper}>
						<div className={ordersListStyles.emptyBox}>
							<div className={ordersListStyles.emptyTitle}>По вашим заказам ещё не выставлено ни одного счёта.</div>
						</div>
					</div>
				) : (
					invoices.map((order) => {
						const status = getInvoiceStatus(order);
						return (
							<div key={order._id} className={styles.invoiceCard}>
								<div className={styles.invoiceHeader}>
									<div className={styles.invoiceOrderRow}>
										<span>Заказ: </span>
										{/* В ссылке и отображении используем наш человекочитаемый ID заказа (orderId). */}
										<Link href={`/user/orders/${order.orderId || order._id}`} className={styles.invoiceOrderLink}>
											#{order.orderId || order._id}
										</Link>
									</div>
									<div className={styles.invoiceStatus}>{status}</div>
								</div>
								<div className={styles.invoiceBody}>
									<div>
										<div className={styles.invoiceRowLabel}>Описание</div>
										<div className={styles.invoiceRowValue}>{order.description}</div>
									</div>
									<div>
										<div className={styles.invoiceRowLabel}>Сумма счёта</div>
										<div className={styles.invoiceRowValue}>{typeof order.order_coast === "number" ? `$${order.order_coast.toFixed(2)}` : "—"}</div>
									</div>
									<div>
										<div className={styles.invoiceRowLabel}>Оплачено</div>
										<div className={styles.invoiceRowValue}>{typeof order.paid === "number" ? `$${order.paid.toFixed(2)}` : "$0.00"}</div>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
