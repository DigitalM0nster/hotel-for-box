import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { FlightModel } from "@/mongodb/models/flightModel";
import { BagModel } from "@/mongodb/models/bagModel";
import { BranchModel } from "@/mongodb/models/branchModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IFlight } from "@/mongodb/models/flightModel";
import { Types } from "mongoose";

// API endpoint для получения списка рейсов.
// Этот endpoint доступен только для администраторов.
// Возвращает все рейсы с информацией о количестве мешков и общем весе.
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

		// 4. Получаем все рейсы, отсортированные по дате создания (новые первыми).
		const flightsDocs = await FlightModel.find().sort({ createdAt: -1 }).lean();

		// 5. Получаем все склады для отображения названий.
		const branches = await BranchModel.find().lean();
		const branchesMap = new Map(branches.map((b) => [String(b._id), b]));

		// 6. Для каждого рейса получаем количество мешков и общий вес.
		const flights = await Promise.all(
			normalizeDbRes<IFlight[]>(flightsDocs).map(async (flight) => {
				// Находим все мешки, привязанные к этому рейсу
				// flight._id после normalizeDbRes - это строка, преобразуем в ObjectId для поиска
				const flightObjectId = new Types.ObjectId(String(flight._id));
				const bags = await BagModel.find({ flightId: flightObjectId }).lean();

				// Считаем количество мешков
				const bagsCount = bags.length;

				// Считаем общий вес всех мешков
				const totalWeightKg = bags.reduce((sum, bag) => sum + (bag.weightKg || 0), 0);

				// Получаем названия складов
				const fromBranch = flight.fromBranchId ? branchesMap.get(String(flight.fromBranchId)) : null;
				const toBranch = flight.toBranchId ? branchesMap.get(String(flight.toBranchId)) : null;

				// Преобразуем статус в читаемый формат
				const statusLabels: Record<string, string> = {
					Planned: "Запланирован",
					"In transit": "В пути",
					Arrived: "Прибыл",
					Closed: "Закрыт",
				};

				return {
					_id: String(flight._id),
					code: flight.code,
					fromCountry: flight.fromCountry,
					toCountry: flight.toCountry,
					fromBranchTitle: fromBranch?.title || "-",
					toBranchTitle: toBranch?.title || "-",
					status: statusLabels[flight.status] || flight.status,
					plannedDepartureAt: flight.plannedDepartureAt,
					plannedArrivalAt: flight.plannedArrivalAt,
					bagsCount,
					totalWeightKg,
					createdAt: flight.createdAt || new Date(),
				};
			})
		);

		// 7. Возвращаем данные отчёта в формате JSON.
		return NextResponse.json({
			flights,
			total: flights.length,
		});
	} catch (error) {
		console.error("flights report error", error);
		return NextResponse.json({ message: "Ошибка получения отчёта по рейсам" }, { status: 500 });
	}
}
