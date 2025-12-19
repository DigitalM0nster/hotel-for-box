"use client";

import { useState, useEffect } from "react";
import styles from "./DashboardDateFilter.module.scss";
import { getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from "@/helpers/dateHelpers";

type DashboardDateFilterProps = {
	onApply: (dateFrom: string | null, dateTo: string | null) => void;
};

// Компонент фильтра по датам для дашборда.
// Позволяет выбрать период для отображения статистики.
// По умолчанию устанавливает период от первого до последнего дня текущего месяца.
export default function DashboardDateFilter({ onApply }: DashboardDateFilterProps) {
	// Получаем первый и последний день текущего месяца для значений по умолчанию
	const defaultDateFrom = getFirstDayOfCurrentMonth();
	const defaultDateTo = getLastDayOfCurrentMonth();

	const [dateFrom, setDateFrom] = useState<string>(defaultDateFrom);
	const [dateTo, setDateTo] = useState<string>(defaultDateTo);

	// Автоматически применяем фильтр с значениями по умолчанию при первой загрузке компонента
	useEffect(() => {
		onApply(defaultDateFrom, defaultDateTo);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Обработчик нажатия кнопки "Применить"
	const handleApply = () => {
		onApply(dateFrom || null, dateTo || null);
	};

	return (
		<div className={styles.filtersRow}>
			{/* Поле выбора начальной даты */}
			<div className={styles.dateFilterWrapper}>
				<label htmlFor="dateFrom" className={styles.dateLabel}>
					От
				</label>
				<input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={styles.dateInput} />
			</div>

			{/* Поле выбора конечной даты */}
			<div className={styles.dateFilterWrapper}>
				<label htmlFor="dateTo" className={styles.dateLabel}>
					До
				</label>
				<input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={styles.dateInput} />
			</div>

			{/* Кнопка применения фильтра */}
			<button className={styles.applyButton} type="button" onClick={handleApply}>
				Применить
			</button>
		</div>
	);
}
