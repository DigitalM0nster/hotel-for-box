"use client";

import styles from "./DashboardPieChart.module.scss";

// Типы данных для круговой диаграммы
export type PieChartItem = {
	percentage: number;
	color: string;
};

type DashboardPieChartProps = {
	items: PieChartItem[];
	size?: number; // Размер диаграммы в пикселях
};

// Компонент круговой диаграммы.
// Отображает процентное соотношение данных в виде круговой диаграммы.
// Использует SVG для отрисовки сегментов круга.
export default function DashboardPieChart({ items, size = 220 }: DashboardPieChartProps) {
	// Если нет данных, показываем пустое состояние
	if (items.length === 0) {
		return (
			<div className={styles.chartWrapper} style={{ width: size, height: size }}>
				<div className={styles.emptyState}>Нет данных</div>
			</div>
		);
	}

	const radius = size / 2 - 10; // Радиус круга с отступом
	const centerX = size / 2;
	const centerY = size / 2;
	const circumference = 2 * Math.PI * radius; // Длина окружности

	// Вычисляем координаты для каждого сегмента
	let currentAngle = -90; // Начинаем с верхней точки (12 часов)
	const paths: Array<{ d: string; color: string; percentage: number }> = [];

	items.forEach((item) => {
		const percentage = item.percentage;
		if (percentage <= 0) return;

		// Вычисляем угол для текущего сегмента
		const angle = (percentage / 100) * 360;
		const endAngle = currentAngle + angle;

		// Преобразуем углы в радианы
		const startAngleRad = (currentAngle * Math.PI) / 180;
		const endAngleRad = (endAngle * Math.PI) / 180;

		// Вычисляем координаты начальной и конечной точек дуги
		const x1 = centerX + radius * Math.cos(startAngleRad);
		const y1 = centerY + radius * Math.sin(startAngleRad);
		const x2 = centerX + radius * Math.cos(endAngleRad);
		const y2 = centerY + radius * Math.sin(endAngleRad);

		// Определяем, большая ли дуга (больше 180 градусов)
		const largeArcFlag = angle > 180 ? 1 : 0;

		// Создаём путь для сегмента
		const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

		paths.push({ d, color: item.color, percentage });

		currentAngle = endAngle;
	});

	return (
		<div className={styles.chartWrapper} style={{ width: size, height: size }}>
			<svg width={size} height={size} className={styles.chartSvg}>
				{/* Рисуем каждый сегмент */}
				{paths.map((path, index) => (
					<path key={index} d={path.d} fill={path.color} className={styles.chartSegment} />
				))}
			</svg>
		</div>
	);
}
