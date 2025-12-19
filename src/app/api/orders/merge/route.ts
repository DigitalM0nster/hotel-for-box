import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
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

		const groupId = await generateGroupId();

		// Для админов не проверяем userId - они могут объединять любые заказы
		// Для обычных пользователей проверяем, что заказы принадлежат им
		const filter: any = { _id: { $in: orderIds } };
		if (session.user.role !== "admin" && session.user.role !== "super") {
			filter.userId = session.user.id;
		}

		const result = await OrderModel.updateMany(filter, { $set: { groupId } });

		if (result.modifiedCount === 0) {
			return NextResponse.json({ message: "Заказы не найдены или уже объединены" }, { status: 404 });
		}

		return NextResponse.json({ message: "Заказы объединены", groupId });
	} catch (error) {
		console.error("merge orders error", error);
		return NextResponse.json({ message: "Ошибка объединения заказов" }, { status: 500 });
	}
}
