import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { FlightModel } from "@/mongodb/models/flightModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { Types } from "mongoose";

// API endpoint для создания рейса.
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
		const { code, fromCountry, toCountry, fromBranchId, toBranchId, plannedDepartureAt, plannedArrivalAt, admin_description } = body;

		// 5. Создаём новый рейс.
		const newFlight = new FlightModel({
			code,
			fromCountry,
			toCountry,
			fromBranchId: fromBranchId ? new Types.ObjectId(fromBranchId) : null,
			toBranchId: toBranchId ? new Types.ObjectId(toBranchId) : null,
			plannedDepartureAt: plannedDepartureAt ? new Date(plannedDepartureAt) : null,
			plannedArrivalAt: plannedArrivalAt ? new Date(plannedArrivalAt) : null,
			admin_description: admin_description || null,
			status: "Planned", // По умолчанию статус "Запланирован"
		});

		// 6. Сохраняем рейс в базу данных.
		await newFlight.save();

		// 7. Преобразуем данные в удобный формат.
		const flight = normalizeDbRes(newFlight);

		// 8. Возвращаем созданный рейс в формате JSON.
		return NextResponse.json({
			flight,
			message: "Рейс успешно создан",
		});
	} catch (error) {
		console.error("create flight error", error);
		// Если ошибка связана с дублированием кода рейса
		if (error instanceof Error && error.message.includes("duplicate key")) {
			return NextResponse.json({ message: "Рейс с таким кодом уже существует" }, { status: 400 });
		}
		return NextResponse.json({ message: "Ошибка создания рейса" }, { status: 500 });
	}
}
