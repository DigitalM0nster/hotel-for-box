"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../../AdminDashboard.module.scss";
import DashboardDateFilter from "@/components/admin/DashboardDateFilter";
import { getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from "@/helpers/dateHelpers";

// Тип для мешка с информацией о заказах
type BagItem = {
	_id: string;
	name: string;
	weightKg: number;
	flightCode: string | null;
	ordersCount: number;
	createdAt: Date;
};

// Страница отчёта "Управление багажом".
// Показывает список всех мешков с информацией о количестве заказов и весе.
export default function BagsReportPage() {
	const searchParams = useSearchParams();
	const [bags, setBags] = useState<BagItem[]>([]);
	const [loading, setLoading] = useState(true);
	// Устанавливаем значения по умолчанию: первый и последний день текущего месяца
	const defaultDateFrom = getFirstDayOfCurrentMonth();
	const defaultDateTo = getLastDayOfCurrentMonth();
	const [dateFrom, setDateFrom] = useState<string | null>(defaultDateFrom);
	const [dateTo, setDateTo] = useState<string | null>(defaultDateTo);

	// Функция для загрузки данных отчёта
	const loadBags = async (from: string | null, to: string | null) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);

			// Если есть фильтр по рейсу в URL, добавляем его
			const flightIdFromUrl = searchParams.get("flightId");
			if (flightIdFromUrl) {
				params.append("flightId", flightIdFromUrl);
			}

			const response = await fetch(`/api/admin/reports/bags?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки отчёта");
			}

			const data = await response.json();
			setBags(data.bags || []);
		} catch (error) {
			console.error("Ошибка загрузки отчёта по мешкам:", error);
			setBags([]);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при первой загрузке страницы и при изменении фильтра по рейсу с датами по умолчанию
	useEffect(() => {
		const flightIdFromUrl = searchParams.get("flightId");
		loadBags(defaultDateFrom, defaultDateTo);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	// Обработчик применения фильтра по датам
	const handleFilterApply = (from: string | null, to: string | null) => {
		setDateFrom(from);
		setDateTo(to);
		loadBags(from, to);
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

	// Форматируем число
	const formatNumber = (num: number, decimals: number = 2): string => {
		return new Intl.NumberFormat("ru-RU", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(num);
	};

	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>Управление багажом</div>

			{/* Кнопка добавления новой сумки */}
			<div style={{ marginBottom: "16px" }}>
				<Link href="/admin/reports/bags/new" className={styles.reportActionLink}>
					+ Добавить сумку
				</Link>
			</div>

			{/* Фильтр по датам */}
			<DashboardDateFilter onApply={handleFilterApply} />

			{/* Таблица отчёта */}
			{loading ? (
				<div className={styles.loadingState}>Загрузка данных...</div>
			) : bags.length === 0 ? (
				<div className={styles.loadingState}>Нет данных за выбранный период</div>
			) : (
				<div className={styles.reportsTableWrapper}>
					<table className={styles.reportsTable}>
						<thead>
							<tr>
								<th>Номер мешка</th>
								<th>Вес (кг)</th>
								<th>Рейс</th>
								<th>Количество заказов</th>
								<th>Дата создания</th>
								<th>Действия</th>
							</tr>
						</thead>
						<tbody>
							{bags.map((bag) => (
								<tr key={bag._id}>
									<td>{bag.name}</td>
									<td>{formatNumber(bag.weightKg)}</td>
									<td>{bag.flightCode || "-"}</td>
									<td>{bag.ordersCount}</td>
									<td>{formatDate(bag.createdAt)}</td>
									<td>
										<Link href={`/admin/reports/bags/${bag._id}`} className={styles.reportActionLink}>
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
