"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import OrdersTabs from "@/components/orders/OrdersTabs";
import OrdersListBox from "@/components/orders/OrdersListBox";
import OrderFilter from "@/components/ui/OrderFilter/OrderFilter";
import { IOrder } from "@/mongodb/models/orderModel";
import styles from "@/app/(user)/user/orders/OrdersPage.module.scss";

type OrdersTabsContextValue = {
	activeTab: "inProgress" | "completed";
	setActiveTab: (tab: "inProgress" | "completed") => void;
	inProgressOrders: IOrder[];
	completedOrders: IOrder[];
	activeOrders: IOrder[];
};

const OrdersTabsContext = createContext<OrdersTabsContextValue | null>(null);

type OrdersTabsProviderProps = {
	orders: IOrder[];
	children: React.ReactNode;
};

// Заказы считаем завершёнными, когда они получены пользователем
// или полностью доставлены. Всё остальное — «в процессе».
const completedStatuses: IOrder["status"][] = ["Received", "Delivered"];

export function OrdersTabsProvider({ orders, children }: OrdersTabsProviderProps) {
	const [activeTab, setActiveTab] = useState<"inProgress" | "completed">("inProgress");

	const { inProgressOrders, completedOrders, activeOrders } = useMemo(() => {
		const completed = orders.filter((order) => completedStatuses.includes(order.status));
		const inProgress = orders.filter((order) => !completedStatuses.includes(order.status));
		const active = activeTab === "inProgress" ? inProgress : completed;
		return { inProgressOrders: inProgress, completedOrders: completed, activeOrders: active };
	}, [orders, activeTab]);

	const value: OrdersTabsContextValue = {
		activeTab,
		setActiveTab,
		inProgressOrders,
		completedOrders,
		activeOrders,
	};

	return <OrdersTabsContext.Provider value={value}>{children}</OrdersTabsContext.Provider>;
}

function useOrdersTabsContext() {
	const ctx = useContext(OrdersTabsContext);
	if (!ctx) throw new Error("OrdersTabs components must be used within OrdersTabsProvider");
	return ctx;
}

export function OrdersTabsControls() {
	const { activeTab, setActiveTab, inProgressOrders, completedOrders } = useOrdersTabsContext();
	return (
		<div className={styles.tabsRow}>
			<OrdersTabs activeTab={activeTab} onChange={setActiveTab} inProgressCount={inProgressOrders.length} completedCount={completedOrders.length} />
			<OrderFilter />
		</div>
	);
}

export function OrdersTabsList() {
	const { activeOrders } = useOrdersTabsContext();
	return <OrdersListBox orders={activeOrders} />;
}
