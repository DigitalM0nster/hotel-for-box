"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../AdminDashboard.module.scss";

// Тип для рейса
type FlightItem = {
	_id: string;
	code: string;
	fromCountry: string;
	toCountry: string;
	fromBranchTitle: string;
	toBranchTitle: string;
	status: string;
	plannedDepartureAt: Date | null;
	plannedArrivalAt: Date | null;
	bagsCount: number;
	totalWeightKg: number;
	createdAt: Date;
};

// Страница отчёта "Рейсы" (Flights).
// Показывает список всех рейсов с информацией о мешках, весе и статусах.
export default function FlightsReportPage() {
	const [flights, setFlights] = useState<FlightItem[]>([]);
	const [loading, setLoading] = useState(true);

	// Функция для загрузки данных отчёта
	const loadFlights = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/admin/reports/flights");
			if (!response.ok) {
				throw new Error("Ошибка загрузки отчёта");
			}

			const data = await response.json();
			setFlights(data.flights || []);
		} catch (error) {
			console.error("Ошибка загрузки отчёта по рейсам:", error);
			setFlights([]);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при первой загрузке страницы
	useEffect(() => {
		loadFlights();
	}, []);

	// Форматируем дату
	const formatDate = (date: Date | string | null | undefined): string => {
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

	// Форматируем число
	const formatNumber = (num: number, decimals: number = 2): string => {
		return new Intl.NumberFormat("ru-RU", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(num);
	};

	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>Рейсы</div>

			{/* Кнопка добавления нового рейса */}
			<div style={{ marginBottom: "16px" }}>
				<Link href="/admin/reports/flights/new" className={styles.reportActionLink}>
					+ Добавить рейс
				</Link>
			</div>

			{/* Таблица отчёта */}
			{loading ? (
				<div className={styles.loadingState}>Загрузка данных...</div>
			) : flights.length === 0 ? (
				<div className={styles.loadingState}>Нет рейсов</div>
			) : (
				<div className={styles.reportsTableWrapper}>
					<table className={styles.reportsTable}>
						<thead>
							<tr>
								<th>Код рейса</th>
								<th>Откуда</th>
								<th>Куда</th>
								<th>Склад отправления</th>
								<th>Склад назначения</th>
								<th>Планируемая отправка</th>
								<th>Планируемое прибытие</th>
								<th>Статус</th>
								<th>Количество мешков</th>
								<th>Общий вес</th>
								<th>Действия</th>
							</tr>
						</thead>
						<tbody>
							{flights.map((flight) => (
								<tr key={flight._id}>
									<td>{flight.code}</td>
									<td>{flight.fromCountry}</td>
									<td>{flight.toCountry}</td>
									<td>{flight.fromBranchTitle}</td>
									<td>{flight.toBranchTitle}</td>
									<td>{formatDate(flight.plannedDepartureAt)}</td>
									<td>{formatDate(flight.plannedArrivalAt)}</td>
									<td>{flight.status}</td>
									<td>{flight.bagsCount}</td>
									<td>{formatNumber(flight.totalWeightKg)} кг</td>
									<td>
										<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
											<Link href={`/admin/reports/flights/${flight._id}`} className={styles.reportActionLink} title="Просмотр">
												👁
											</Link>
											<Link href={`/admin/reports/bags?flightId=${flight._id}`} className={styles.reportActionLink} title="Мешки">
												Мешки
											</Link>
										</div>
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
