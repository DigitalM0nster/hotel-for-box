"use client";

import OrdersList from "@/components/lists/OrdersList/OrdersList";
import { IOrder } from "@/mongodb/models/orderModel";

type OrdersListBoxProps = {
	orders: IOrder[];
};

export default function OrdersListBox({ orders }: OrdersListBoxProps) {
	return <OrdersList orders={orders} />;
}
