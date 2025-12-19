import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel, IOrderStatus } from "@/mongodb/models/orderModel";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Генерация человекочитаемого groupId для группы заказов.
// Формат: ровно 6 цифр, например "000123".
// Это то, что будем показывать как «ID группы» вместо длинного UUID.
const generateGroupId = async (): Promise<string> => {
	while (true) {
		// Берём случайные байты, переводим в число и сжимаем до диапазона 0..999999.
		const randomBytes = crypto.randomBytes(4).toString("hex");
		const asNumber = parseInt(randomBytes, 16);
		const digits = (asNumber % 1_000_000).toString().padStart(6, "0");
		const candidate = digits;

		// Проверяем, что такого groupId ещё нет в базе.
		const exists = await OrderModel.exists({ groupId: candidate });
		if (!exists) return candidate;
	}
};

// Проверяем, можно ли объединять заказ с таким статусом.
// И пользователь, и админ могут объединять только до "Shipping approved" (до выставления счёта).
// После выставления счёта заказ уже в процессе оплаты/отправки, менять состав группы нельзя.
const canMergeOrder = (status: IOrderStatus): boolean => {
	// Статусы в порядке жизненного цикла заказа
	// Логика: Created → Shipping approved (выставлен счёт) → Shipping paid (оплачено) → Arrived (прибыло в Монголию) → Departed → Delivered → Received
	const statusOrder: IOrderStatus[] = ["Created", "Shipping approved", "Shipping paid", "Arrived", "Departed", "Delivered", "Received", "Return", "Cancelled"];

	const statusIndex = statusOrder.indexOf(status);
	if (statusIndex === -1) return false; // Неизвестный статус

	// Все могут объединять только до "Shipping approved" (индекс 1)
	// После выставления счёта уже нельзя объединять
	return statusIndex < statusOrder.indexOf("Shipping approved");
};

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		const { orderIds } = await request.json();
		if (!Array.isArray(orderIds) || orderIds.length < 2) {
			return NextResponse.json({ message: "Нужно выбрать минимум два заказа" }, { status: 400 });
		}

		await connectDB();

		const isAdmin = session.user.role === "admin" || session.user.role === "super";

		// Загружаем все заказы для проверки
		const filter: any = { _id: { $in: orderIds } };
		if (!isAdmin) {
			filter.userId = session.user.id;
		}

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
			if (!canMergeOrder(order.status)) {
				const orderId = order.orderId || order._id?.toString() || "неизвестный";
				blockedOrders.push(orderId);
			}
		}

		if (blockedOrders.length > 0) {
			return NextResponse.json(
				{
					message: `Нельзя объединять заказы со статусом после "Shipping approved". Заблокированные заказы: ${blockedOrders.join(", ")}`,
				},
				{ status: 400 }
			);
		}

		// Собираем все старые groupId, которые будут затронуты
		const oldGroupIds = new Set<string>();
		for (const order of orders) {
			if (order.groupId) {
				oldGroupIds.add(order.groupId);
			}
		}

		// Генерируем новый groupId для объединения
		const newGroupId = await generateGroupId();

		// Объединяем заказы в новую группу
		const result = await OrderModel.updateMany(filter, { $set: { groupId: newGroupId } });

		if (result.modifiedCount === 0) {
			return NextResponse.json({ message: "Не удалось объединить заказы" }, { status: 404 });
		}

		// Проверяем старые группы: если в группе остался только 1 заказ, убираем groupId
		// (группа должна содержать минимум 2 заказа)
		for (const oldGroupId of oldGroupIds) {
			const remainingOrders = await OrderModel.find({ groupId: oldGroupId }).lean();
			if (remainingOrders.length === 1) {
				// Если остался только 1 заказ, убираем groupId (заказ становится независимым)
				const orderToUpdate = remainingOrders[0];
				await OrderModel.updateMany({ groupId: oldGroupId }, { $set: { groupId: null } });

				// Если заказ был в сумке (bagId), оставляем bagId как есть
				// bagId - это физическая связь (заказ физически в сумке), она не зависит от groupId
				// groupId - это логическая связь (для удобства управления)
				if (orderToUpdate.bagId) {
					console.log(`⚠️ Заказ ${orderToUpdate.orderId || orderToUpdate._id} стал независимым (убрали groupId), но остаётся в сумке ${orderToUpdate.bagId}`);
				}
			}
		}

		return NextResponse.json({ message: "Заказы объединены", groupId: newGroupId });
	} catch (error) {
		console.error("merge orders error", error);
		return NextResponse.json({ message: "Ошибка объединения заказов" }, { status: 500 });
	}
}
