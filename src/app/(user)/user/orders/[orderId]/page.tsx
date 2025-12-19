import OrderInfo from "@/components/common/OrderInfo/OrderInfo";
import OrderForm from "@/components/forms/orderForm";
import BackPageInfoPanel from "@/components/html/BackPageInfoPanel/BackPageInfoPanel";
import { getOrderById } from "@/libs/services/orderService";
import { getUserWithAdresses } from "@/libs/services/usersService";

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
	const { orderId } = await params;

	const user = await getUserWithAdresses();

	//! CREATING ORDER
	if (orderId === "new_order")
		return (
			<>
				{/* панель назад нужна только при создании заказа */}
				<BackPageInfoPanel />
				<OrderForm user={user} order={null} />
			</>
		);

	const order = await getOrderById(orderId);

	//! NOT FOUND
	if (!order) return <div>Заказ не найден</div>;

	//! SHOW ORDER
	return (
		<>
			<BackPageInfoPanel />
			<OrderInfo order={order} />
		</>
	);
}
