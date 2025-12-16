// components/CircleProgress.tsx
"use client";

import React from "react";
import styles from "./CircleProgress.module.scss";

type Props = {
    value: number; // 0–100
    size?: number; // px
    strokeWidth?: number; // px
    className?: string;
};

const CircleProgress: React.FC<Props> = ({
    value,
    size = 104,
    strokeWidth = 10,
    className = "",
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className={`${styles.wrapper} ${className}`} style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className={styles.background}
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={styles.progress}
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <span className={styles.text}>{value}</span>
        </div>
    );
};

export default CircleProgress;
