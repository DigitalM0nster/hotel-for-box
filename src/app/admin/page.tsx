"use client";

import { useState, useEffect } from "react";
import styles from "./AdminDashboard.module.scss";
import DashboardDateFilter from "@/components/admin/DashboardDateFilter";
import DashboardStatsTable, { StatItem } from "@/components/admin/DashboardStatsTable";
import DashboardPieChart, { PieChartItem } from "@/components/admin/DashboardPieChart";
import OldOrdersTable from "@/components/admin/OldOrdersTable";
import type { DashboardStats } from "@/app/api/admin/dashboard/stats/route";
import { IOrder } from "@/mongodb/models/orderModel";

// Цвета для диаграмм (используем разные оттенки синего и серого)
const CHART_COLORS = ["#4a7dff", "#6b9fff", "#8cb3ff", "#a8c7ff", "#c4dbff", "#e0efff"];

// Компонент контента дашборда администратора.
// Меню вынесено в отдельный компонент AdminSidebar и рендерится в layout.tsx.
export default function AdminDashboardPage() {
	// Состояние для раздела "Продажи по складам"
	const [salesStats, setSalesStats] = useState<StatItem[]>([]);
	const [salesChartData, setSalesChartData] = useState<PieChartItem[]>([]);
	const [salesLoading, setSalesLoading] = useState(true);
	const [salesDateFrom, setSalesDateFrom] = useState<string | null>(null);
	const [salesDateTo, setSalesDateTo] = useState<string | null>(null);

	// Состояние для раздела "Обработки по складам"
	const [processingStats, setProcessingStats] = useState<StatItem[]>([]);
	const [processingChartData, setProcessingChartData] = useState<PieChartItem[]>([]);
	const [processingLoading, setProcessingLoading] = useState(true);
	const [processingDateFrom, setProcessingDateFrom] = useState<string | null>(null);
	const [processingDateTo, setProcessingDateTo] = useState<string | null>(null);

	// Состояние для раздела "Заказы старше двух недель"
	const [oldOrders, setOldOrders] = useState<IOrder[]>([]);
	const [oldOrdersPage, setOldOrdersPage] = useState(1);
	const [oldOrdersTotalPages, setOldOrdersTotalPages] = useState(1);
	const [oldOrdersLoading, setOldOrdersLoading] = useState(true);

	// Функция для загрузки статистики по продажам
	const loadSalesStats = async (from: string | null, to: string | null) => {
		setSalesLoading(true);
		try {
			// Формируем URL с параметрами фильтрации по датам
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);

			// Отправляем запрос к API endpoint для получения статистики
			const response = await fetch(`/api/admin/dashboard/stats?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки статистики");
			}

			// Получаем данные в формате JSON
			const data: DashboardStats = await response.json();

			// Преобразуем данные о продажах в формат для таблицы и диаграммы
			const salesItems: StatItem[] = data.salesByBranch.map((item, index) => ({
				branchTitle: item.branchTitle,
				value: item.totalSales,
				percentage: item.percentage,
				color: CHART_COLORS[index % CHART_COLORS.length],
			}));

			const salesChart: PieChartItem[] = data.salesByBranch.map((item, index) => ({
				percentage: item.percentage,
				color: CHART_COLORS[index % CHART_COLORS.length],
			}));

			// Сохраняем данные в состояние компонента
			setSalesStats(salesItems);
			setSalesChartData(salesChart);
		} catch (error) {
			console.error("Ошибка загрузки статистики по продажам:", error);
			// В случае ошибки очищаем данные
			setSalesStats([]);
			setSalesChartData([]);
		} finally {
			setSalesLoading(false);
		}
	};

	// Функция для загрузки статистики по обработкам
	const loadProcessingStats = async (from: string | null, to: string | null) => {
		setProcessingLoading(true);
		try {
			// Формируем URL с параметрами фильтрации по датам
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);

			// Отправляем запрос к API endpoint для получения статистики
			const response = await fetch(`/api/admin/dashboard/stats?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки статистики");
			}

			// Получаем данные в формате JSON
			const data: DashboardStats = await response.json();

			// Преобразуем данные об обработках в формат для таблицы и диаграммы
			const processingItems: StatItem[] = data.processingByBranch.map((item, index) => ({
				branchTitle: item.branchTitle,
				value: item.totalProcessings,
				percentage: item.percentage,
				color: CHART_COLORS[index % CHART_COLORS.length],
			}));

			const processingChart: PieChartItem[] = data.processingByBranch.map((item, index) => ({
				percentage: item.percentage,
				color: CHART_COLORS[index % CHART_COLORS.length],
			}));

			// Сохраняем данные в состояние компонента
			setProcessingStats(processingItems);
			setProcessingChartData(processingChart);
		} catch (error) {
			console.error("Ошибка загрузки статистики по обработкам:", error);
			// В случае ошибки очищаем данные
			setProcessingStats([]);
			setProcessingChartData([]);
		} finally {
			setProcessingLoading(false);
		}
	};

	// Функция для загрузки заказов старше двух недель
	const loadOldOrders = async (pageNum: number = 1) => {
		setOldOrdersLoading(true);
		try {
			const response = await fetch(`/api/admin/dashboard/old-orders?page=${pageNum}&limit=50`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки заказов");
			}
			const data = await response.json();
			setOldOrders(data.orders);
			setOldOrdersPage(data.page);
			setOldOrdersTotalPages(data.totalPages);
		} catch (error) {
			console.error("Ошибка загрузки заказов старше двух недель:", error);
			setOldOrders([]);
		} finally {
			setOldOrdersLoading(false);
		}
	};

	// Загружаем статистику и заказы при первой загрузке страницы
	useEffect(() => {
		loadSalesStats(null, null);
		loadProcessingStats(null, null);
		loadOldOrders(1);
	}, []);

	// Обработчик применения фильтра по датам для раздела продаж
	const handleSalesFilterApply = (from: string | null, to: string | null) => {
		setSalesDateFrom(from);
		setSalesDateTo(to);
		loadSalesStats(from, to);
	};

	// Обработчик применения фильтра по датам для раздела обработок
	const handleProcessingFilterApply = (from: string | null, to: string | null) => {
		setProcessingDateFrom(from);
		setProcessingDateTo(to);
		loadProcessingStats(from, to);
	};

	return (
		<div className={styles.cardsColumn}>
			{/* Заголовок страницы */}
			<div className={styles.pageTitle}>Панель управления</div>

			{/* Раздел: Общие продажи по складам */}
			<section className={styles.card}>
				<div className={styles.cardTitle}>Общие продажи по складам</div>

				{/* Фильтр по датам для раздела продаж */}
				<DashboardDateFilter onApply={handleSalesFilterApply} />

				{/* Таблица и диаграмма */}
				<div className={styles.chartsRow}>
					{salesLoading ? (
						<div className={styles.loadingState}>Загрузка данных...</div>
					) : (
						<>
							<DashboardStatsTable items={salesStats} valueLabel="₽" />
							<DashboardPieChart items={salesChartData} size={220} />
						</>
					)}
				</div>
			</section>

			{/* Раздел: Общее количество обработок по складам */}
			<section className={styles.card}>
				<div className={styles.cardTitle}>Общее количество обработок по складам</div>

				{/* Фильтр по датам для раздела обработок */}
				<DashboardDateFilter onApply={handleProcessingFilterApply} />

				{/* Таблица и диаграмма */}
				<div className={styles.chartsRow}>
					{processingLoading ? (
						<div className={styles.loadingState}>Загрузка данных...</div>
					) : (
						<>
							<DashboardStatsTable items={processingStats} valueLabel="шт." />
							<DashboardPieChart items={processingChartData} size={220} />
						</>
					)}
				</div>
			</section>

			{/* Раздел: Заказы старше двух недель */}
			<section className={styles.card}>
				<div className={styles.cardTitle}>Заказы старше двух недель</div>

				{/* Таблица заказов */}
				{oldOrdersLoading ? (
					<div className={styles.loadingState}>Загрузка данных...</div>
				) : (
					<OldOrdersTable initialOrders={oldOrders} initialPage={oldOrdersPage} initialTotalPages={oldOrdersTotalPages} />
				)}
			</section>
		</div>
	);
}
