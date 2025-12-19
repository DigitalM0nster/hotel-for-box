import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { BagModel } from "@/mongodb/models/bagModel";
import { FlightModel } from "@/mongodb/models/flightModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IBag } from "@/mongodb/models/bagModel";
import { Types } from "mongoose";

// API endpoint для получения сумок рейса.
// Этот endpoint доступен только для администраторов.
export async function GET(request: Request, { params }: { params: { id: string } }) {
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
		const flightObjectId = new Types.ObjectId(flightId);

		// 5. Получаем все сумки, привязанные к этому рейсу.
		const bagsDocs = await BagModel.find({ flightId: flightObjectId }).sort({ createdAt: -1 }).lean();

		// 6. Преобразуем данные сумок в формат отчёта.
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

		// 7. Возвращаем список сумок рейса в формате JSON.
		return NextResponse.json({
			bags,
			total: bags.length,
		});
	} catch (error) {
		console.error("flight bags error", error);
		return NextResponse.json({ message: "Ошибка получения сумок рейса" }, { status: 500 });
	}
}

// API endpoint для привязки сумок к рейсу.
// Этот endpoint доступен только для администраторов.
export async function POST(request: Request, { params }: { params: { id: string } }) {
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
		const flightObjectId = new Types.ObjectId(flightId);

		// 5. Проверяем, что рейс существует.
		const flight = await FlightModel.findById(flightObjectId);
		if (!flight) {
			return NextResponse.json({ message: "Рейс не найден" }, { status: 404 });
		}

		// 6. Получаем список ID сумок из тела запроса.
		const body = await request.json();
		const { bagIds } = body;

		if (!Array.isArray(bagIds) || bagIds.length === 0) {
			return NextResponse.json({ message: "Не указаны сумки для привязки" }, { status: 400 });
		}

		// 7. Привязываем каждую сумку к рейсу.
		const bagObjectIds = bagIds.map((id: string) => new Types.ObjectId(id));
		await BagModel.updateMany({ _id: { $in: bagObjectIds } }, { flightId: flightObjectId });

		// 8. Возвращаем успешный ответ.
		return NextResponse.json({
			message: "Сумки успешно привязаны к рейсу",
			attached: bagIds.length,
		});
	} catch (error) {
		console.error("attach bags to flight error", error);
		return NextResponse.json({ message: "Ошибка привязки сумок к рейсу" }, { status: 500 });
	}
}
