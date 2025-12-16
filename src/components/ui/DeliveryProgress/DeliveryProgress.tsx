"use client";

import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { changeOrderStatus } from "@/libs/services/orderService";
import { IOrderStatus, StatusEnToRu } from "@/mongodb/models/orderModel";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-toastify";

type Orientation = "horizontal" | "vertical";
type DeliveryStatus = keyof typeof StatusEnToRu;

type DeliveryProgressProps = {
    orderId: string;
    status: DeliveryStatus;
    orientation?: Orientation;
};

export function DeliveryProgress({
    orderId,
    status,
    orientation = "horizontal",
}: DeliveryProgressProps) {
    const steps = Object.entries(StatusEnToRu).map(([key, label]) => ({
        key: key as DeliveryStatus,
        label,
    }));

    const [currentStepIndex, setCurrentStepIndex] = useState(
        steps.findIndex((step) => step.key === status)
    );

    const statusChange = async (idx: number) => {
        setCurrentStepIndex(idx);
        const statuses = Object.keys(StatusEnToRu);

        const res = await changeOrderStatus(orderId, statuses[idx]);
        toastShowResult(res);
    };

    return (
        <div
            className={clsx(
                "w-full",
                orientation === "horizontal" ? "flex items-start" : "flex flex-col gap-6"
            )}
        >
            {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isLast = index === steps.length - 1;

                return (
                    <div
                        key={step.key}
                        className={clsx(
                            "relative flex-1",
                            orientation === "horizontal"
                                ? "flex flex-col items-center"
                                : "flex items-start gap-4"
                        )}
                    >
                        {/* Горизонтальная линия до следующего шага */}
                        {orientation === "horizontal" && !isLast && (
                            <div
                                className={clsx(
                                    "absolute top-[14px]",
                                    // от центра текущего кружка до центра следующего
                                    "left-1/2 right-[-50%]",
                                    "h-[2px]",
                                    isActive ? "bg-blue-600" : "bg-neutral-300"
                                )}
                            />
                        )}

                        {/* Вертикальная линия */}
                        {orientation === "vertical" && !isLast && (
                            <div
                                className={clsx(
                                    "absolute left-[14px] top-7 bottom-[-24px] w-[2px]",
                                    isActive ? "bg-blue-600" : "bg-neutral-300"
                                )}
                            />
                        )}

                        {/* Кружок */}
                        <div
                            className={clsx(
                                "z-10 flex items-center justify-center rounded-full border cursor-pointer select-none",
                                "w-7 h-7 text-xs font-semibold transition-colors",
                                isActive
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-neutral-300 text-neutral-400"
                            )}
                            onClick={() => statusChange(index)}
                        >
                            {index + 1}
                        </div>

                        {/* Подпись */}
                        <div
                            className={clsx(
                                "mt-2 text-xs text-center leading-tight",
                                "max-w-[120px]",
                                isActive ? "text-blue-600" : "text-neutral-400"
                            )}
                        >
                            {step.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
