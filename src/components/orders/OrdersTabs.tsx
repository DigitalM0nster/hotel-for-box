"use client";

import styles from "@/app/(user)/user/orders/OrdersPage.module.scss";

type OrdersTabsProps = {
	activeTab: "inProgress" | "completed";
	inProgressCount: number;
	completedCount: number;
	onChange: (tab: "inProgress" | "completed") => void;
};

export default function OrdersTabs({ activeTab, inProgressCount, completedCount, onChange }: OrdersTabsProps) {
	return (
		<div className={styles.tabs}>
			<button type="button" className={`${styles.tabItem} ${activeTab === "inProgress" ? styles.tabActive : styles.tabInactive}`} onClick={() => onChange("inProgress")}>
				В процессе ({inProgressCount})
			</button>
			<button type="button" className={`${styles.tabItem} ${activeTab === "completed" ? styles.tabActive : styles.tabInactive}`} onClick={() => onChange("completed")}>
				Завершенные ({completedCount})
			</button>
		</div>
	);
}
