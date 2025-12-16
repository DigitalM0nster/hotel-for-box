"use client";

import { StatusEnToRu } from "@/mongodb/models/orderModel";
import React from "react";

type StatusKey = keyof typeof StatusEnToRu;

interface TimelineProps {
    current: StatusKey;
}

export const StatusTimeline: React.FC<TimelineProps> = ({ current }) => {
    const steps = Object.keys(StatusEnToRu) as StatusKey[];
    const currentIndex = steps.indexOf(current);

    return (
        <div className="w-full">
            {/* Линия с кружками */}
            <div className="flex items-center w-full">
                {steps.map((step, index) => {
                    const isActive = index <= currentIndex;
                    return (
                        <div key={step} className="flex items-center flex-1">
                            {/* Кружок */}
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center 
                  ${isActive ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}
                `}
                            >
                                {index + 1}
                            </div>

                            {/* Линия к следующему кружку */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`h-1 flex-1 
                    ${isActive ? "bg-blue-600" : "bg-gray-300"}
                  `}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Подписи под кружками */}
            <div className="flex justify-between mt-2">
                {steps.map((step) => (
                    <span key={step} className="text-sm text-center w-20">
                        {StatusEnToRu[step]}
                    </span>
                ))}
            </div>
        </div>
    );
};
