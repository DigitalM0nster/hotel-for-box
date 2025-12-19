import { auth } from "@/auth";
import styles from "../AdminDashboard.module.scss";
import { getOrdersForAdmin } from "@/libs/services/orderService";
import AdminOrdersList from "@/components/admin/AdminOrdersList";
import Link from "next/link";

type AdminOrdersPageProps = {
	searchParams: {
		page?: string;
		sortField?: string;
		sortDirection?: string;

		// Фильтры по статусу и базовым полям.
		statusFilter?: string;
		orderIdFilter?: string;
		externalOrderIdFilter?: string;
		trackFilter?: string;
		groupIdFilter?: string;
		cityFilter?: string;
		isFinalFilter?: string;

		// Диапазон по дате создания.
		createdFrom?: string;
		createdTo?: string;

		// Способ доставки (warehouse / courier).
		shipmentMethodFilter?: string;

		// Магазин / отправитель (shopUrl).
		shopFilter?: string;

		// Полка (shelf).
		shelfFilter?: string;

		// Диапазон по весу.
		weightFrom?: string;
		weightTo?: string;

		// Тип формы (физлицо/бизнес).
		formTypeFilter?: string;

		// Статус оплаты счёта (не оплачен / частично / полностью).
		paidStatusFilter?: string;

		// Склад откуда / куда.
		departmentFromId?: string;
		departmentToId?: string;
	};
};

// Страница админского списка заказов.
// Здесь мы читаем параметры из URL, передаём их в серверный сервис
// getOrdersForAdmin и рендерим таблицу AdminOrdersList.
export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
	const session = await auth();

	// Пускаем только администратора и суперадмина.
	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Заказы</div>
					<div>Доступ к разделу заказов есть только у администратора.</div>
				</section>
			</div>
		);
	}

	const page = Number(searchParams.page) > 0 ? Number(searchParams.page) : 1;

	const sortField = (searchParams.sortField as "createdAt" | "status" | "orderId" | "track") || "createdAt";
	const sortDirection = (searchParams.sortDirection as "asc" | "desc") === "asc" ? "asc" : "desc";

	const statusFilter = searchParams.statusFilter as "Created" | "Received" | "Shipping approved" | "Shipping paid" | "Departed" | "Arrived" | "Delivered" | undefined;

	const shipmentMethodFilter =
		searchParams.shipmentMethodFilter === "warehouse" || searchParams.shipmentMethodFilter === "courier"
			? (searchParams.shipmentMethodFilter as "warehouse" | "courier")
			: undefined;

	const createdFrom = searchParams.createdFrom || undefined;
	const createdTo = searchParams.createdTo || undefined;

	const shopFilter = searchParams.shopFilter || undefined;
	const shelfFilter = searchParams.shelfFilter || undefined;

	const weightFrom = typeof searchParams.weightFrom === "string" && searchParams.weightFrom.trim() !== "" ? Number(searchParams.weightFrom) : undefined;
	const weightTo = typeof searchParams.weightTo === "string" && searchParams.weightTo.trim() !== "" ? Number(searchParams.weightTo) : undefined;

	const formTypeFilter =
		searchParams.formTypeFilter === "person" || searchParams.formTypeFilter === "business" ? (searchParams.formTypeFilter as "person" | "business") : undefined;

	const paidStatusFilter =
		searchParams.paidStatusFilter === "not_paid" || searchParams.paidStatusFilter === "partial" || searchParams.paidStatusFilter === "full"
			? (searchParams.paidStatusFilter as "not_paid" | "partial" | "full")
			: undefined;

	const departmentFromId = searchParams.departmentFromId || undefined;
	const departmentToId = searchParams.departmentToId || undefined;

	const { orders, totalPages } = await getOrdersForAdmin({
		page,
		limit: 50,
		sortField,
		sortDirection,
		statusFilter,
		orderIdFilter: searchParams.orderIdFilter,
		externalOrderIdFilter: searchParams.externalOrderIdFilter,
		trackFilter: searchParams.trackFilter,
		groupIdFilter: searchParams.groupIdFilter,
		cityFilter: searchParams.cityFilter,
		createdFrom,
		createdTo,
		shipmentMethodFilter,
		shopFilter,
		shelfFilter,
		weightFrom,
		weightTo,
		formTypeFilter,
		paidStatusFilter,
		departmentFromId,
		departmentToId,
	});

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Заказы</div>
				<AdminOrdersList orders={orders} page={page} totalPages={totalPages} sortField={sortField} sortDirection={sortDirection} />

				<Link href="/admin/orders/new" className={styles.applyButton}>
					Создать заказ
				</Link>
			</section>
		</div>
	);
}
