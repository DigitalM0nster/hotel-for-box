"use client";

import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { changeOrderStatus } from "@/libs/services/orderService";
import { IOrderStatus, StatusEnToRu } from "@/mongodb/models/orderModel";
import { useState } from "react";
import { toast } from "react-toastify";
import styles from "./DeliveryProgress.module.scss";

type Orientation = "horizontal" | "vertical";
type DeliveryStatus = keyof typeof StatusEnToRu;

type DeliveryProgressProps = {
	orderId: string;
	status: DeliveryStatus;
	orientation?: Orientation;
};

export function DeliveryProgress({ orderId, status, orientation = "horizontal" }: DeliveryProgressProps) {
	const steps = Object.entries(StatusEnToRu).map(([key, label]) => ({
		key: key as DeliveryStatus,
		label,
	}));

	const [currentStepIndex, setCurrentStepIndex] = useState(steps.findIndex((step) => step.key === status));

	const statusChange = async (idx: number) => {
		setCurrentStepIndex(idx);
		const statuses = Object.keys(StatusEnToRu);

		const res = await changeOrderStatus(orderId, statuses[idx]);
		toastShowResult(res);
	};

	return (
		<div className={`${styles.progressWrapper} ${orientation === "horizontal" ? styles.horizontal : styles.vertical}`}>
			{steps.map((step, index) => {
				const isActive = index <= currentStepIndex;
				const isLast = index === steps.length - 1;

				return (
					<div key={step.key} className={`${styles.step} ${orientation === "horizontal" ? styles.stepHorizontal : styles.stepVertical}`}>
						{/* Горизонтальная линия до следующего шага */}
						{orientation === "horizontal" && !isLast && <div className={`${styles.lineHorizontal} ${isActive ? styles.lineActive : styles.lineInactive}`} />}

						{/* Вертикальная линия */}
						{orientation === "vertical" && !isLast && <div className={`${styles.lineVertical} ${isActive ? styles.lineActive : styles.lineInactive}`} />}

						{/* Кружок */}
						<div className={`${styles.circle} ${isActive ? styles.circleActive : styles.circleInactive}`} onClick={() => statusChange(index)}>
							{index + 1}
						</div>

						{/* Подпись */}
						<div className={`${styles.label} ${isActive ? styles.labelActive : styles.labelInactive}`}>{step.label}</div>
					</div>
				);
			})}
		</div>
	);
}
