"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../AdminDashboard.module.scss";
import DashboardDateFilter from "@/components/admin/DashboardDateFilter";

// Тип для записи истории полок
type ShelfHistoryItem = {
	orderId: string;
	currentShelf: string;
	historyEntry: {
		shelf: string;
		userName: string;
		case: string;
		createdAt: Date;
	};
};

// Страница отчёта "История полок".
// Показывает историю изменений полок для заказов: когда заказ был перемещён, кто это сделал.
export default function ShelfHistoryReportPage() {
	const [items, setItems] = useState<ShelfHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [dateFrom, setDateFrom] = useState<string | null>(null);
	const [dateTo, setDateTo] = useState<string | null>(null);

	// Функция для загрузки данных отчёта
	const loadShelfHistory = async (from: string | null, to: string | null) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);

			const response = await fetch(`/api/admin/reports/shelf-history?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки отчёта");
			}

			const data = await response.json();
			setItems(data.items || []);
		} catch (error) {
			console.error("Ошибка загрузки истории полок:", error);
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при первой загрузке страницы
	useEffect(() => {
		loadShelfHistory(null, null);
	}, []);

	// Обработчик применения фильтра по датам
	const handleFilterApply = (from: string | null, to: string | null) => {
		setDateFrom(from);
		setDateTo(to);
		loadShelfHistory(from, to);
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
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>История полок</div>

			{/* Фильтр по датам */}
			<DashboardDateFilter onApply={handleFilterApply} />

			{/* Таблица отчёта */}
			{loading ? (
				<div className={styles.loadingState}>Загрузка данных...</div>
			) : items.length === 0 ? (
				<div className={styles.loadingState}>Нет данных за выбранный период</div>
			) : (
				<div className={styles.reportsTableWrapper}>
					<table className={styles.reportsTable}>
						<thead>
							<tr>
								<th>ID заказа</th>
								<th>Текущая полка</th>
								<th>Предыдущая полка</th>
								<th>Кто изменил</th>
								<th>Описание</th>
								<th>Дата изменения</th>
								<th>Действия</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, index) => (
								<tr key={index}>
									<td>{item.orderId ? `#${item.orderId}` : "-"}</td>
									<td>{item.currentShelf || "-"}</td>
									<td>{item.historyEntry.shelf || "-"}</td>
									<td>{item.historyEntry.userName || "-"}</td>
									<td>{item.historyEntry.case || "-"}</td>
									<td>{formatDate(item.historyEntry.createdAt)}</td>
									<td>
										<Link href={`/admin/orders/${item.orderId}`} className={styles.reportActionLink}>
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
