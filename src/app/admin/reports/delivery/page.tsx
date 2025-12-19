"use client";

import { useState, useEffect } from "react";
import styles from "../../AdminDashboard.module.scss";
import DashboardDateFilter from "@/components/admin/DashboardDateFilter";

// Тип для агрегированной строки отчёта по доставке
type DeliveryReportItem = {
	createdAt: Date;
	flightCode: string | null;
	departmentFrom: string;
	shipmentMethod: string;
	packages: number;
	mailboxes: number;
	weight: number;
	splited: number;
	combined: number;
	amounts: {
		total: number;
		toCollect: number;
		authorize: number;
		points: number;
		tdb: number;
		cod: number;
		collect: number;
		card: number;
		cash: number;
		standart: number;
	};
};

// Тип для склада (для фильтра)
type Branch = {
	_id: string;
	title: string;
};

// Страница отчёта "Доставка".
// Показывает агрегированные данные по доставкам, сгруппированные по рейсам, складам и способам доставки.
export default function DeliveryReportPage() {
	const [items, setItems] = useState<DeliveryReportItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [dateFrom, setDateFrom] = useState<string | null>(null);
	const [dateTo, setDateTo] = useState<string | null>(null);
	const [departmentFromId, setDepartmentFromId] = useState<string | null>(null);
	const [nameFilter, setNameFilter] = useState<string>("");
	const [branches, setBranches] = useState<Branch[]>([]);

	// Загружаем список складов для фильтра
	useEffect(() => {
		const loadBranches = async () => {
			try {
				const response = await fetch("/api/admin/branches");
				if (response.ok) {
					const data = await response.json();
					setBranches(data.branches || []);
				}
			} catch (error) {
				console.error("Ошибка загрузки складов:", error);
			}
		};
		loadBranches();
	}, []);

	// Функция для загрузки данных отчёта
	const loadDeliveryReport = async (from: string | null, to: string | null, deptId: string | null, name: string) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);
			if (deptId) params.append("departmentFromId", deptId);
			if (name.trim()) params.append("name", name.trim());

			const response = await fetch(`/api/admin/reports/delivery?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки отчёта");
			}

			const data = await response.json();
			setItems(data.items || []);
		} catch (error) {
			console.error("Ошибка загрузки отчёта по доставке:", error);
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при первой загрузке страницы
	useEffect(() => {
		loadDeliveryReport(null, null, null, "");
	}, []);

	// Обработчик применения фильтра по датам
	const handleDateFilterApply = (from: string | null, to: string | null) => {
		setDateFrom(from);
		setDateTo(to);
		loadDeliveryReport(from, to, departmentFromId, nameFilter);
	};

	// Обработчик изменения фильтра по складу
	const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value || null;
		setDepartmentFromId(value);
		loadDeliveryReport(dateFrom, dateTo, value, nameFilter);
	};

	// Обработчик изменения фильтра по имени (с дебаунсом)
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			loadDeliveryReport(dateFrom, dateTo, departmentFromId, nameFilter);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [nameFilter]);

	// Обработчик сброса фильтров
	const handleClearFilters = () => {
		setDateFrom(null);
		setDateTo(null);
		setDepartmentFromId(null);
		setNameFilter("");
		loadDeliveryReport(null, null, null, "");
	};

	// Форматируем дату
	const formatDate = (date: Date | string | null | undefined): string => {
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

	// Форматируем суммы для отображения
	const formatAmounts = (amounts: DeliveryReportItem["amounts"]): string => {
		const lines: string[] = [];
		if (amounts.total > 0) lines.push(`Всего $${formatNumber(amounts.total)}`);
		if (amounts.toCollect > 0) lines.push(`К сбору $${formatNumber(amounts.toCollect)}`);
		if (amounts.authorize > 0) lines.push(`Стандарт Authoriz $${formatNumber(amounts.authorize)}`);
		if (amounts.points > 0) lines.push(`Баллы $${formatNumber(amounts.points)}`);
		if (amounts.tdb > 0) lines.push(`Tdb $${formatNumber(amounts.tdb)}`);
		if (amounts.cod > 0) lines.push(`Cod $${formatNumber(amounts.cod)}`);
		if (amounts.collect > 0) lines.push(`Collect $${formatNumber(amounts.collect)}`);
		if (amounts.cash > 0) lines.push(`Наличные $${formatNumber(amounts.cash)}`);
		if (amounts.standart > 0) lines.push(`Стандарт $${formatNumber(amounts.standart)}`);
		return lines.length > 0 ? lines.join("\n") : "-";
	};

	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>Доставка</div>

			{/* Фильтры */}
			<div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
				{/* Фильтр по датам */}
				<DashboardDateFilter onApply={handleDateFilterApply} />

				{/* Дополнительные фильтры */}
				<div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
					{/* Фильтр по складу отправления */}
					<div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "200px" }}>
						<label htmlFor="departmentFrom" style={{ fontSize: "14px", color: "#56688e" }}>
							Пункт отправления
						</label>
						<select
							id="departmentFrom"
							value={departmentFromId || ""}
							onChange={handleDepartmentChange}
							style={{
								padding: "12px",
								borderRadius: "8px",
								border: "1px solid #e0e0e0",
								fontSize: "14px",
								background: "#fff",
							}}
						>
							<option value="">Все склады</option>
							{branches.map((branch) => (
								<option key={branch._id} value={branch._id}>
									{branch.title}
								</option>
							))}
						</select>
					</div>

					{/* Фильтр по имени/рейсу */}
					<div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "200px", flex: 1 }}>
						<label htmlFor="nameFilter" style={{ fontSize: "14px", color: "#56688e" }}>
							Имя / Рейс
						</label>
						<input
							id="nameFilter"
							type="text"
							value={nameFilter}
							onChange={(e) => setNameFilter(e.target.value)}
							placeholder="Поиск по рейсу или складу"
							style={{
								padding: "12px",
								borderRadius: "8px",
								border: "1px solid #e0e0e0",
								fontSize: "14px",
							}}
						/>
					</div>

					{/* Кнопка сброса фильтров */}
					<button
						type="button"
						onClick={handleClearFilters}
						style={{
							padding: "12px 24px",
							borderRadius: "8px",
							border: "1px solid #e0e0e0",
							background: "#fff",
							cursor: "pointer",
							fontSize: "14px",
							color: "#d32f2f",
						}}
					>
						Сбросить фильтры
					</button>
				</div>
			</div>

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
								<th>Создано</th>
								<th>Рейс</th>
								<th>Пункт отправления</th>
								<th>Способ отправки</th>
								<th>Посылки</th>
								<th>Mailbox</th>
								<th>Вес</th>
								<th>Разделённые</th>
								<th>Объединённые</th>
								<th>Суммы</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, index) => (
								<tr key={index}>
									<td>{formatDate(item.createdAt)}</td>
									<td>{item.flightCode}</td>
									<td>{item.departmentFrom}</td>
									<td>{item.shipmentMethod}</td>
									<td>{item.packages}</td>
									<td>{item.mailboxes}</td>
									<td>{formatNumber(item.weight)}</td>
									<td>{item.splited}</td>
									<td>{item.combined}</td>
									<td style={{ whiteSpace: "pre-line", fontSize: "12px", lineHeight: "1.6" }}>{formatAmounts(item.amounts)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
