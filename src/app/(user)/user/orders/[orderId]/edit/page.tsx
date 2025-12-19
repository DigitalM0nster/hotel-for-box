import OrderForm from "@/components/forms/orderForm";
import BackPageInfoPanel from "@/components/html/BackPageInfoPanel/BackPageInfoPanel";
import { getOrderById } from "@/libs/services/orderService";
import { getUserWithAdresses } from "@/libs/services/usersService";

// Страница редактирования конкретного заказа.
// Здесь мы берём существующий заказ и пользователя с адресами
// и передаём их в ту же форму, что используется при создании заказа.
export default async function EditOrderPage({ params }: { params: { orderId: string } }) {
	const { orderId } = params;

	// Получаем пользователя и сам заказ
	const user = await getUserWithAdresses();
	const order = await getOrderById(orderId);

	if (!user) return <div>Требуется авторизация</div>;
	if (!order) return <div>Заказ не найден</div>;

	return (
		<>
			<BackPageInfoPanel />
			<OrderForm user={user} order={order} />
		</>
	);
}
