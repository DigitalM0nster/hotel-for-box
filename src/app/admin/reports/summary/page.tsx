"use client";

import { useState, useEffect } from "react";
import styles from "../../AdminDashboard.module.scss";
import DashboardDateFilter from "@/components/admin/DashboardDateFilter";

// Типы для сводки
type SummaryData = {
	totalOrders: number;
	totalSales: number;
	totalWeight: number;
	ordersByStatus: Array<{
		status: string;
		count: number;
		percentage: number;
	}>;
	ordersByBranch: Array<{
		branchTitle: string;
		count: number;
		percentage: number;
	}>;
};

// Страница отчёта "Сводка".
// Показывает агрегированные данные по всем заказам: общее количество, сумма, вес, статистика по статусам и складам.
export default function SummaryReportPage() {
	const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
	const [loading, setLoading] = useState(true);
	const [dateFrom, setDateFrom] = useState<string | null>(null);
	const [dateTo, setDateTo] = useState<string | null>(null);

	// Функция для загрузки сводных данных
	const loadSummary = async (from: string | null, to: string | null) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);

			const response = await fetch(`/api/admin/reports/summary?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки сводки");
			}

			const data: SummaryData = await response.json();
			setSummaryData(data);
		} catch (error) {
			console.error("Ошибка загрузки сводки:", error);
			setSummaryData(null);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при первой загрузке страницы
	useEffect(() => {
		loadSummary(null, null);
	}, []);

	// Обработчик применения фильтра по датам
	const handleFilterApply = (from: string | null, to: string | null) => {
		setDateFrom(from);
		setDateTo(to);
		loadSummary(from, to);
	};

	// Форматируем число с разделителями тысяч
	const formatNumber = (num: number, decimals: number = 2): string => {
		return new Intl.NumberFormat("ru-RU", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(num);
	};

	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>Сводка</div>

			{/* Фильтр по датам */}
			<DashboardDateFilter onApply={handleFilterApply} />

			{/* Данные сводки */}
			{loading ? (
				<div className={styles.loadingState}>Загрузка данных...</div>
			) : summaryData ? (
				<div className={styles.summaryContent}>
					{/* Основные показатели */}
					<div className={styles.summaryMetrics}>
						<div className={styles.summaryMetric}>
							<div className={styles.summaryMetricLabel}>Всего заказов</div>
							<div className={styles.summaryMetricValue}>{formatNumber(summaryData.totalOrders, 0)}</div>
						</div>
						<div className={styles.summaryMetric}>
							<div className={styles.summaryMetricLabel}>Общая сумма продаж</div>
							<div className={styles.summaryMetricValue}>{formatNumber(summaryData.totalSales)} ₽</div>
						</div>
						<div className={styles.summaryMetric}>
							<div className={styles.summaryMetricLabel}>Общий вес</div>
							<div className={styles.summaryMetricValue}>{formatNumber(summaryData.totalWeight)} кг</div>
						</div>
					</div>

					{/* Статистика по статусам */}
					<div className={styles.summarySection}>
						<div className={styles.summarySectionTitle}>Статистика по статусам</div>
						<div className={styles.summaryTable}>
							{summaryData.ordersByStatus.map((item, index) => (
								<div key={index} className={styles.summaryTableRow}>
									<div className={styles.summaryTableLabel}>{item.status}</div>
									<div className={styles.summaryTableValue}>{item.count}</div>
									<div className={styles.summaryTablePercentage}>{formatNumber(item.percentage, 1)}%</div>
								</div>
							))}
						</div>
					</div>

					{/* Статистика по складам */}
					<div className={styles.summarySection}>
						<div className={styles.summarySectionTitle}>Статистика по складам</div>
						<div className={styles.summaryTable}>
							{summaryData.ordersByBranch.map((item, index) => (
								<div key={index} className={styles.summaryTableRow}>
									<div className={styles.summaryTableLabel}>{item.branchTitle}</div>
									<div className={styles.summaryTableValue}>{item.count}</div>
									<div className={styles.summaryTablePercentage}>{formatNumber(item.percentage, 1)}%</div>
								</div>
							))}
						</div>
					</div>
				</div>
			) : (
				<div className={styles.loadingState}>Нет данных за выбранный период</div>
			)}
		</section>
	);
}
