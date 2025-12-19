"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../AdminDashboard.module.scss";
import DashboardDateFilter from "@/components/admin/DashboardDateFilter";
import { getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from "@/helpers/dateHelpers";

// Тип для заказа на самовывоз
type WalkinOrder = {
	_id: string;
	orderId: string;
	shelf: string;
	h4b_us_id: string;
	userName: string;
	userEmail: string;
	userPhone: string;
	status: string;
	createdAt: Date;
};

// Страница отчёта "Самовывоз" (Walkin).
// Показывает заказы, которые клиенты могут забрать сами со склада (deliveryMethod === "warehouse").
export default function WalkinReportPage() {
	const [orders, setOrders] = useState<WalkinOrder[]>([]);
	const [loading, setLoading] = useState(true);
	// Устанавливаем значения по умолчанию: первый и последний день текущего месяца
	const defaultDateFrom = getFirstDayOfCurrentMonth();
	const defaultDateTo = getLastDayOfCurrentMonth();
	const [dateFrom, setDateFrom] = useState<string | null>(defaultDateFrom);
	const [dateTo, setDateTo] = useState<string | null>(defaultDateTo);

	// Функция для загрузки данных отчёта
	const loadWalkinOrders = async (from: string | null, to: string | null) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);

			const response = await fetch(`/api/admin/reports/walkin?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки отчёта");
			}

			const data = await response.json();
			setOrders(data.orders || []);
		} catch (error) {
			console.error("Ошибка загрузки отчёта по самовывозу:", error);
			setOrders([]);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при первой загрузке страницы с датами по умолчанию
	useEffect(() => {
		loadWalkinOrders(defaultDateFrom, defaultDateTo);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Обработчик применения фильтра по датам
	const handleFilterApply = (from: string | null, to: string | null) => {
		setDateFrom(from);
		setDateTo(to);
		loadWalkinOrders(from, to);
	};

	// Форматируем дату
	const formatDate = (date: Date | string | undefined): string => {
		if (!date) return "-";
		const d = new Date(date);
		if (isNaN(d.getTime())) return "-";
		return d.toLocaleDateString("ru-RU", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>Самовывоз (Walkin)</div>

			{/* Фильтр по датам */}
			<DashboardDateFilter onApply={handleFilterApply} />

			{/* Таблица отчёта */}
			{loading ? (
				<div className={styles.loadingState}>Загрузка данных...</div>
			) : orders.length === 0 ? (
				<div className={styles.loadingState}>Нет данных за выбранный период</div>
			) : (
				<div className={styles.reportsTableWrapper}>
					<table className={styles.reportsTable}>
						<thead>
							<tr>
								<th>ID заказа</th>
								<th>Полка</th>
								<th>Абонентский ящик</th>
								<th>Пользователь</th>
								<th>Email</th>
								<th>Телефон</th>
								<th>Статус</th>
								<th>Дата создания</th>
								<th>Действия</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((order) => (
								<tr key={order._id}>
									<td>{order.orderId ? `#${order.orderId}` : `#${order._id.slice(-6)}`}</td>
									<td>{order.shelf || "-"}</td>
									<td>{order.h4b_us_id ? `#${order.h4b_us_id}` : "-"}</td>
									<td>{order.userName}</td>
									<td>{order.userEmail}</td>
									<td>{order.userPhone}</td>
									<td>{order.status}</td>
									<td>{formatDate(order.createdAt)}</td>
									<td>
										<Link href={`/admin/orders/${order.orderId || order._id}`} className={styles.reportActionLink}>
											Просмотр
										</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
