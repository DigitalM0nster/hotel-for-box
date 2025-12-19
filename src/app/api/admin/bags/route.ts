import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { BagModel } from "@/mongodb/models/bagModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";

// API endpoint для создания сумки.
// Этот endpoint доступен только для администраторов.
export async function POST(request: Request) {
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

		// 4. Получаем данные из тела запроса.
		const body = await request.json();
		const { name, weightKg, orderIds, admin_description } = body;

		// 5. Создаём новую сумку.
		const newBag = new BagModel({
			name,
			weightKg: weightKg || 0,
			orderIds: orderIds || [], // Массив orderId заказов
			admin_description: admin_description || null,
			flightId: null, // По умолчанию сумка не привязана к рейсу
		});

		// 6. Сохраняем сумку в базу данных.
		await newBag.save();

		// 7. Преобразуем данные в удобный формат.
		const bag = normalizeDbRes(newBag);

		// 8. Возвращаем созданную сумку в формате JSON.
		return NextResponse.json({
			bag,
			message: "Сумка успешно создана",
		});
	} catch (error) {
		console.error("create bag error", error);
		// Если ошибка связана с дублированием названия сумки
		if (error instanceof Error && error.message.includes("duplicate key")) {
			return NextResponse.json({ message: "Сумка с таким названием уже существует" }, { status: 400 });
		}
		return NextResponse.json({ message: "Ошибка создания сумки" }, { status: 500 });
	}
}
