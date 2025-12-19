import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { BagModel } from "@/mongodb/models/bagModel";
import { FlightModel } from "@/mongodb/models/flightModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IBag } from "@/mongodb/models/bagModel";

// API endpoint для получения списка мешков.
// Этот endpoint доступен только для администраторов.
// Возвращает все мешки с информацией о количестве заказов и привязанном рейсе.
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

		// 4. Получаем параметры фильтрации из URL.
		const { searchParams } = new URL(request.url);
		const dateFrom = searchParams.get("dateFrom");
		const dateTo = searchParams.get("dateTo");
		const flightId = searchParams.get("flightId");

		// 5. Строим фильтр для мешков по дате создания.
		const dateFilter: Record<string, unknown> = {};
		if (dateFrom) {
			const fromDate = new Date(dateFrom);
			fromDate.setHours(0, 0, 0, 0);
			dateFilter.createdAt = { $gte: fromDate };
		}
		if (dateTo) {
			const toDate = new Date(dateTo);
			toDate.setHours(23, 59, 59, 999);
			if (dateFilter.createdAt) {
				dateFilter.createdAt = { ...dateFilter.createdAt, $lte: toDate };
			} else {
				dateFilter.createdAt = { $lte: toDate };
			}
		}

		// 6. Добавляем фильтр по рейсу, если указан flightId.
		if (flightId) {
			dateFilter.flightId = flightId;
		}

		// 7. Получаем все мешки, отсортированные по дате создания (новые первыми).
		const bagsDocs = await BagModel.find(dateFilter).sort({ createdAt: -1 }).lean();

		// 8. Получаем все рейсы для отображения кодов рейсов.
		const flights = await FlightModel.find().lean();
		const flightsMap = new Map(flights.map((f) => [String(f._id), f]));

		// 9. Преобразуем данные мешков в формат отчёта.
		const bags = normalizeDbRes<IBag[]>(bagsDocs).map((bag) => {
			// Получаем код рейса, если мешок привязан к рейсу
			const flight = bag.flightId ? flightsMap.get(String(bag.flightId)) : null;

			// Считаем количество заказов в мешке
			const ordersCount = bag.orderIds ? bag.orderIds.length : 0;

			return {
				_id: String(bag._id),
				name: bag.name,
				weightKg: bag.weightKg || 0,
				flightCode: flight?.code || null,
				ordersCount,
				createdAt: bag.createdAt || new Date(),
			};
		});

		// 10. Возвращаем данные отчёта в формате JSON.
		return NextResponse.json({
			bags,
			total: bags.length,
		});
	} catch (error) {
		console.error("bags report error", error);
		return NextResponse.json({ message: "Ошибка получения отчёта по мешкам" }, { status: 500 });
	}
}
