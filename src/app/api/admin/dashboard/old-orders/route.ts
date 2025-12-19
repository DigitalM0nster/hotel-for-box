import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
import { BranchModel } from "@/mongodb/models/branchModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IOrder } from "@/mongodb/models/orderModel";

// API endpoint для получения заказов старше двух недель.
// Этот endpoint доступен только для администраторов.
// Заказы считаются "старше двух недель", если их дата создания (createdAt)
// меньше чем (текущая дата - 14 дней).
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

		// 4. Вычисляем дату, которая была 14 дней назад.
		//    Заказы, созданные раньше этой даты, считаются "старше двух недель".
		const twoWeeksAgo = new Date();
		twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
		twoWeeksAgo.setHours(0, 0, 0, 0); // Начало дня

		// 5. Получаем параметры пагинации из URL.
		//    Например: /api/admin/dashboard/old-orders?page=1&limit=50
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "50", 10);

		// 6. Находим все заказы, которые старше двух недель.
		//    Фильтруем по createdAt < twoWeeksAgo.
		const skip = (page - 1) * limit;
		const [ordersDocs, total] = await Promise.all([
			OrderModel.find({
				createdAt: { $lt: twoWeeksAgo },
			})
				.sort({ createdAt: -1 }) // Сортируем по дате создания (новые первыми)
				.skip(skip)
				.limit(limit)
				.lean(),
			OrderModel.countDocuments({
				createdAt: { $lt: twoWeeksAgo },
			}),
		]);

		// 7. Получаем все склады для отображения названий.
		const branches = await BranchModel.find().lean();
		const branchesMap = new Map(branches.map((b) => [String(b._id), b]));

		// 8. Преобразуем данные заказов в удобный формат.
		//    Добавляем информацию о складе, если он есть.
		const orders = normalizeDbRes<IOrder[]>(ordersDocs).map((order) => {
			// Получаем название склада отправления, если он есть
			let branchTitle = "-";
			if (order.originBranchId) {
				const branch = branchesMap.get(String(order.originBranchId));
				branchTitle = branch?.title || "-";
			}

			return {
				...order,
				// Добавляем вычисляемое поле для названия склада
				branchTitle,
			};
		});

		// 9. Вычисляем общее количество страниц.
		const totalPages = Math.max(1, Math.ceil(total / limit));

		// 10. Возвращаем заказы в формате JSON.
		return NextResponse.json({
			orders,
			total,
			page,
			limit,
			totalPages,
		});
	} catch (error) {
		console.error("old orders error", error);
		return NextResponse.json({ message: "Ошибка получения заказов" }, { status: 500 });
	}
}
