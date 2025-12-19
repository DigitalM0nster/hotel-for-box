"use client";

import styles from "./DashboardStatsTable.module.scss";

// Типы данных для таблицы статистики
export type StatItem = {
	branchTitle: string;
	value: number;
	percentage: number;
	color?: string;
};

type DashboardStatsTableProps = {
	items: StatItem[];
	valueLabel?: string; // Подпись для значения (например, "₽" или "шт.")
};

// Компонент таблицы статистики по складам.
// Отображает список складов с их значениями и процентами.
// Каждая строка имеет цветной индикатор, который соответствует цвету на диаграмме.
export default function DashboardStatsTable({ items, valueLabel = "" }: DashboardStatsTableProps) {
	// Форматируем число с разделителями тысяч
	// Если valueLabel пустой (для количества), форматируем как целое число
	const formatNumber = (num: number, isInteger: boolean = false): string => {
		return new Intl.NumberFormat("ru-RU", {
			minimumFractionDigits: isInteger ? 0 : 2,
			maximumFractionDigits: isInteger ? 0 : 2,
		}).format(num);
	};

	// Форматируем процент с одним знаком после запятой
	const formatPercentage = (num: number): string => {
		return num.toFixed(1).replace(".", ",");
	};

	return (
		<div className={styles.tableWrapper}>
			{items.length === 0 ? (
				<div className={styles.emptyState}>Нет данных за выбранный период</div>
			) : (
				items.map((item, index) => (
					<div key={index} className={styles.tableRow}>
						{/* Цветной индикатор, соответствующий цвету на диаграмме */}
						<div className={styles.colorIndicator} style={{ backgroundColor: item.color || "#4a7dff" }} />
						{/* Название склада */}
						<div className={styles.branchName}>{item.branchTitle}</div>
						{/* Значение (сумма или количество) */}
						<div className={styles.value}>
							{formatNumber(item.value, valueLabel === "шт.")} {valueLabel}
						</div>
						{/* Процент от общего значения */}
						<div className={styles.percentage}>{formatPercentage(item.percentage)}%</div>
					</div>
				))
			)}
		</div>
	);
}
