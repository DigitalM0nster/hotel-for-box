import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { FlightModel } from "@/mongodb/models/flightModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { Types } from "mongoose";

// API endpoint для обновления рейса.
// Этот endpoint доступен только для администраторов.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

		// 4. Получаем ID рейса из параметров URL.
		const flightId = params.id;

		// 5. Находим рейс по ID.
		const flight = await FlightModel.findById(flightId);
		if (!flight) {
			return NextResponse.json({ message: "Рейс не найден" }, { status: 404 });
		}

		// 6. Получаем данные из тела запроса.
		const body = await request.json();
		const { code, fromCountry, toCountry, fromBranchId, toBranchId, plannedDepartureAt, plannedArrivalAt, admin_description } = body;

		// 7. Обновляем поля рейса.
		if (code !== undefined) flight.code = code;
		if (fromCountry !== undefined) flight.fromCountry = fromCountry;
		if (toCountry !== undefined) flight.toCountry = toCountry;
		if (fromBranchId !== undefined) flight.fromBranchId = fromBranchId ? new Types.ObjectId(fromBranchId) : null;
		if (toBranchId !== undefined) flight.toBranchId = toBranchId ? new Types.ObjectId(toBranchId) : null;
		if (plannedDepartureAt !== undefined) flight.plannedDepartureAt = plannedDepartureAt ? new Date(plannedDepartureAt) : null;
		if (plannedArrivalAt !== undefined) flight.plannedArrivalAt = plannedArrivalAt ? new Date(plannedArrivalAt) : null;
		if (admin_description !== undefined) flight.admin_description = admin_description || null;

		// 8. Сохраняем обновлённый рейс в базу данных.
		await flight.save();

		// 9. Преобразуем данные в удобный формат.
		const updatedFlight = normalizeDbRes(flight);

		// 10. Возвращаем обновлённый рейс в формате JSON.
		return NextResponse.json({
			flight: updatedFlight,
			message: "Рейс успешно обновлён",
		});
	} catch (error) {
		console.error("update flight error", error);
		return NextResponse.json({ message: "Ошибка обновления рейса" }, { status: 500 });
	}
}
