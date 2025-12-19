import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IOrder } from "@/mongodb/models/orderModel";

// API endpoint для поиска заказов по orderId и объединённых групп по groupId.
// Этот endpoint доступен только для администраторов.
// Используется для автодополнения при выборе заказов для сумки.
export async function GET(request: Request) {
	try {
		// 1. Проверяем авторизацию пользователя через NextAuth.
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		// 2. Проверяем, что пользователь имеет права администратора.
		const role = session.user.role ?? "user";
		if (role !== "admin" && role !== "super") {
			return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
		}

		// 3. Подключаемся к базе данных MongoDB.
		await connectDB();

		// 4. Получаем параметр поиска из URL.
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q");

		if (!query || query.trim().length === 0) {
			return NextResponse.json({ orders: [], groups: [], total: 0 });
		}

		// 5. Ищем заказы по orderId (человекочитаемый ID заказа).
		// Используем регулярное выражение для частичного совпадения.
		const searchRegex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
		const ordersDocs = await OrderModel.find({ orderId: searchRegex })
			.limit(20) // Ограничиваем результат 20 заказами для автодополнения
			.sort({ createdAt: -1 })
			.lean();

		// 6. Ищем объединённые группы по groupId.
		const groupsDocs = await OrderModel.find({ groupId: searchRegex })
			.limit(20) // Ограничиваем результат 20 группами
			.sort({ createdAt: -1 })
			.lean();

		// 7. Преобразуем отдельные заказы в удобный формат.
		const orders = normalizeDbRes<IOrder[]>(ordersDocs).map((order) => ({
			_id: String(order._id),
			orderId: order.orderId || "-",
			track: order.track || "-",
			weight: order.weight || 0,
			status: order.status,
			type: "order" as const, // Тип: отдельный заказ
		}));

		// 8. Группируем заказы по groupId и создаём объекты групп.
		const groupsMap = new Map<string, IOrder[]>();
		normalizeDbRes<IOrder[]>(groupsDocs).forEach((order) => {
			if (order.groupId) {
				if (!groupsMap.has(order.groupId)) {
					groupsMap.set(order.groupId, []);
				}
				groupsMap.get(order.groupId)!.push(order);
			}
		});

		// 9. Преобразуем группы в формат результатов.
		const groups = Array.from(groupsMap.entries()).map(([groupId, groupOrders]) => {
			const totalWeight = groupOrders.reduce((sum, o) => sum + (o.weight || 0), 0);
			// Берём первый заказ из группы для отображения основной информации
			const firstOrder = groupOrders[0];
			return {
				_id: `group_${groupId}`, // Уникальный ID для группы
				groupId: groupId,
				orderId: `Группа ${groupId}`, // Отображаемое название
				track: `${groupOrders.length} заказов`, // Показываем количество заказов
				weight: totalWeight,
				status: firstOrder?.status || "-",
				type: "group" as const, // Тип: объединённая группа
				ordersCount: groupOrders.length,
				orderIds: groupOrders.map((o) => o.orderId || "").filter(Boolean), // Все orderId из группы
			};
		});

		// 10. Возвращаем список найденных заказов и групп в формате JSON.
		return NextResponse.json({
			orders,
			groups,
			total: orders.length + groups.length,
		});
	} catch (error) {
		console.error("search orders error", error);
		return NextResponse.json({ message: "Ошибка поиска заказов" }, { status: 500 });
	}
}
