import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel, IOrderStatus } from "@/mongodb/models/orderModel";
import { NextResponse } from "next/server";

// Проверяем, можно ли разделять заказ с таким статусом.
// И пользователь, и админ могут разделять только до "Shipping approved" (до выставления счёта).
// После выставления счёта заказ уже в процессе оплаты/отправки, менять состав группы нельзя.
const canSplitOrder = (status: IOrderStatus): boolean => {
	// Статусы в порядке жизненного цикла заказа
	// Логика: Created → Shipping approved (выставлен счёт) → Shipping paid (оплачено) → Arrived (прибыло в Монголию) → Departed → Delivered → Received
	const statusOrder: IOrderStatus[] = ["Created", "Shipping approved", "Shipping paid", "Arrived", "Departed", "Delivered", "Received", "Return", "Cancelled"];

	const statusIndex = statusOrder.indexOf(status);
	if (statusIndex === -1) return false; // Неизвестный статус

	// Все могут разделять только до "Shipping approved" (индекс 1)
	// После выставления счёта уже нельзя разделять
	return statusIndex < statusOrder.indexOf("Shipping approved");
};

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		const { orderIds } = await request.json();
		if (!Array.isArray(orderIds) || orderIds.length < 1) {
			return NextResponse.json({ message: "Нужно выбрать хотя бы один заказ" }, { status: 400 });
		}

		await connectDB();

		const isAdmin = session.user.role === "admin" || session.user.role === "super";

		// Для админов не проверяем userId - они могут разделять любые заказы
		// Для обычных пользователей проверяем, что заказы принадлежат им
		const filter: any = { _id: { $in: orderIds } };
		if (!isAdmin) {
			filter.userId = session.user.id;
		}

		// Загружаем заказы для проверки статусов и групп
		const orders = await OrderModel.find(filter).lean();

		if (orders.length === 0) {
			return NextResponse.json({ message: "Заказы не найдены" }, { status: 404 });
		}

		if (orders.length !== orderIds.length) {
			return NextResponse.json({ message: "Некоторые заказы не найдены или не принадлежат вам" }, { status: 403 });
		}

		// Проверяем статусы всех заказов
		const blockedOrders: string[] = [];
		for (const order of orders) {
			if (!canSplitOrder(order.status)) {
				const orderId = order.orderId || order._id?.toString() || "неизвестный";
				blockedOrders.push(orderId);
			}
		}

		if (blockedOrders.length > 0) {
			return NextResponse.json(
				{
					message: `Нельзя разделять заказы со статусом после "Shipping approved". Заблокированные заказы: ${blockedOrders.join(", ")}`,
				},
				{ status: 400 }
			);
		}

		// Собираем все groupId, которые будут затронуты
		const affectedGroupIds = new Set<string>();
		for (const order of orders) {
			if (order.groupId) {
				affectedGroupIds.add(order.groupId);
			}
		}

		// Проверяем, не останется ли в группах только 1 заказ после разделения
		for (const groupId of affectedGroupIds) {
			// Считаем, сколько заказов в группе сейчас
			const totalInGroup = await OrderModel.countDocuments({ groupId });
			// Считаем, сколько заказов из этой группы мы хотим разделить
			const toSplitFromGroup = orders.filter((o) => o.groupId === groupId).length;

			// Если после разделения в группе останется меньше 2 заказов, запрещаем разделение
			if (totalInGroup - toSplitFromGroup < 2 && totalInGroup - toSplitFromGroup > 0) {
				return NextResponse.json(
					{
						message: `Нельзя разделить группу ${groupId}: в группе должно остаться минимум 2 заказа. Сейчас в группе ${totalInGroup} заказов, вы хотите разделить ${toSplitFromGroup}.`,
					},
					{ status: 400 }
				);
			}
		}

		// Разделяем заказы (убираем groupId)
		const result = await OrderModel.updateMany(filter, { $set: { groupId: null } });

		if (result.modifiedCount === 0) {
			return NextResponse.json({ message: "Заказы не найдены или уже разделены" }, { status: 404 });
		}

		// Проверяем оставшиеся группы: если в группе остался только 1 заказ, убираем groupId
		for (const groupId of affectedGroupIds) {
			const remainingOrders = await OrderModel.find({ groupId }).lean();
			if (remainingOrders.length === 1) {
				// Если остался только 1 заказ, убираем groupId (заказ становится независимым)
				const orderToUpdate = remainingOrders[0];
				await OrderModel.updateMany({ groupId }, { $set: { groupId: null } });

				// Если заказ был в сумке (bagId), оставляем bagId как есть
				// bagId - это физическая связь (заказ физически в сумке), она не зависит от groupId
				// groupId - это логическая связь (для удобства управления)
				if (orderToUpdate.bagId) {
					console.log(`⚠️ Заказ ${orderToUpdate.orderId || orderToUpdate._id} стал независимым (убрали groupId), но остаётся в сумке ${orderToUpdate.bagId}`);
				}
			}
		}

		return NextResponse.json({ message: "Заказы разделены" });
	} catch (error) {
		console.error("split orders error", error);
		return NextResponse.json({ message: "Ошибка разделения заказов" }, { status: 500 });
	}
}
