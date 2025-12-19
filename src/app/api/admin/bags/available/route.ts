import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { BagModel } from "@/mongodb/models/bagModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IBag } from "@/mongodb/models/bagModel";

// API endpoint для получения списка свободных сумок (без привязки к рейсу).
// Этот endpoint доступен только для администраторов.
export async function GET() {
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

		// 4. Получаем все сумки, у которых flightId равен null (не привязаны к рейсу).
		const bagsDocs = await BagModel.find({ flightId: null }).sort({ createdAt: -1 }).lean();

		// 5. Преобразуем данные сумок в формат отчёта.
		const bags = normalizeDbRes<IBag[]>(bagsDocs).map((bag) => {
			// Считаем количество заказов в сумке
			const ordersCount = bag.orderIds ? bag.orderIds.length : 0;

			return {
				_id: String(bag._id),
				name: bag.name,
				weightKg: bag.weightKg || 0,
				ordersCount,
				createdAt: bag.createdAt || new Date(),
			};
		});

		// 6. Возвращаем список свободных сумок в формате JSON.
		return NextResponse.json({
			bags,
			total: bags.length,
		});
	} catch (error) {
		console.error("available bags error", error);
		return NextResponse.json({ message: "Ошибка получения свободных сумок" }, { status: 500 });
	}
}
