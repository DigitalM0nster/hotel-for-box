"use client";

import { StatusEnToRu } from "@/mongodb/models/orderModel";
import React from "react";
import styles from "./StatusTimeLine.module.scss";

type StatusKey = keyof typeof StatusEnToRu;

interface TimelineProps {
	current: StatusKey;
	statusUpdateTime?: Date | string; // Время присвоения текущего статуса
	orderCreatedAt?: Date | string; // Время создания заказа
}

export const StatusTimeline: React.FC<TimelineProps> = ({ current, statusUpdateTime, orderCreatedAt }) => {
	const steps = Object.entries(StatusEnToRu).map(([key, label]) => ({
		key: key as StatusKey,
		label,
	}));

	const currentIndex = steps.findIndex((step) => step.key === current);

	// Форматируем дату для отображения
	const formatDateTime = (date: Date | string | undefined): string => {
		if (!date) return "";
		const dateObj = typeof date === "string" ? new Date(date) : date;
		return dateObj.toLocaleString("ru-RU", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Получаем дату для статуса
	const getStatusDate = (index: number): string => {
		// Для текущего статуса используем время обновления
		if (index === currentIndex && statusUpdateTime) {
			return formatDateTime(statusUpdateTime);
		}
		// Для первого статуса используем время создания заказа
		if (index === 0 && orderCreatedAt) {
			return formatDateTime(orderCreatedAt);
		}
		return "";
	};

	return (
		<div className={styles.progressWrapper}>
			{steps.map((step, index) => {
				const isActive = index <= currentIndex;
				const isLast = index === steps.length - 1;
				const statusDate = getStatusDate(index);

				return (
					<div key={step.key} className={styles.step}>
						{/* Горизонтальная линия до следующего шага */}
						{!isLast && <div className={`${styles.lineHorizontal} ${isActive ? styles.lineActive : styles.lineInactive}`} />}

						{/* Кружок */}
						<div className={`${styles.circle} ${isActive ? styles.circleActive : styles.circleInactive}`}>{index + 1}</div>

						{/* Подпись со статусом и датой */}
						<div className={`${styles.label} ${isActive ? styles.labelActive : styles.labelInactive}`}>
							{step.label}
							{isActive && statusDate && <span className={styles.labelDate}>{statusDate}</span>}
						</div>
					</div>
				);
			})}
		</div>
	);
};
