import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
import { BranchModel } from "@/mongodb/models/branchModel";

// Типы для статистики
export type SalesByBranchStat = {
	branchId: string;
	branchTitle: string;
	totalSales: number;
	percentage: number;
};

export type ProcessingByBranchStat = {
	branchId: string;
	branchTitle: string;
	totalProcessings: number;
	percentage: number;
};

export type DashboardStats = {
	salesByBranch: SalesByBranchStat[];
	processingByBranch: ProcessingByBranchStat[];
};

// API endpoint для получения статистики дашборда.
// Этот endpoint доступен только для администраторов.
// Он возвращает статистику по продажам и обработкам по складам за указанный период.
export async function GET(request: Request) {
	try {
		// 1. Проверяем авторизацию пользователя через NextAuth.
		//    Это защищает endpoint от неавторизованных запросов.
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		// 2. Проверяем, что пользователь имеет права администратора.
		//    Только admin и super могут видеть статистику дашборда.
		const role = session.user.role ?? "user";
		if (role !== "admin" && role !== "super") {
			return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
		}

		// 3. Получаем параметры фильтрации из URL (даты начала и конца периода).
		//    Например: /api/admin/dashboard/stats?dateFrom=2024-01-01&dateTo=2024-12-31
		const { searchParams } = new URL(request.url);
		const dateFrom = searchParams.get("dateFrom");
		const dateTo = searchParams.get("dateTo");

		// 4. Подключаемся к базе данных MongoDB.
		//    connectDB проверяет, есть ли уже соединение, и создаёт его, если нужно.
		await connectDB();

		// 5. Строим фильтр для заказов по дате создания.
		//    Если даты не указаны, берём все заказы.
		const dateFilter: Record<string, unknown> = {};
		if (dateFrom) {
			const fromDate = new Date(dateFrom);
			fromDate.setHours(0, 0, 0, 0); // Начало дня
			dateFilter.createdAt = { $gte: fromDate };
		}
		if (dateTo) {
			const toDate = new Date(dateTo);
			toDate.setHours(23, 59, 59, 999); // Конец дня
			if (dateFilter.createdAt) {
				dateFilter.createdAt = { ...dateFilter.createdAt, $lte: toDate };
			} else {
				dateFilter.createdAt = { $lte: toDate };
			}
		}

		// 6. Получаем все склады из базы данных.
		//    Они нужны, чтобы показать название склада в статистике.
		const branches = await BranchModel.find().lean();
		const branchesMap = new Map(branches.map((b) => [String(b._id), b]));

		// 7. СТАТИСТИКА ПО ПРОДАЖАМ ПО СКЛАДАМ.
		//    Группируем заказы по складу отправления (originBranchId) и считаем сумму продаж.
		//    Используем MongoDB aggregation pipeline для группировки данных.
		const salesAggregation = await OrderModel.aggregate([
			// Фильтруем заказы по дате, если указаны даты
			...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
			// Фильтруем только заказы, у которых есть склад отправления
			{ $match: { originBranchId: { $ne: null } } },
			// Группируем по складу отправления и считаем сумму products_total_cost
			{
				$group: {
					_id: "$originBranchId",
					totalSales: { $sum: "$products_total_cost" },
					count: { $sum: 1 },
				},
			},
		]);

		// 8. Преобразуем результаты агрегации в удобный формат.
		//    Для каждого склада считаем процент от общей суммы продаж.
		const totalSales = salesAggregation.reduce((sum, item) => sum + (item.totalSales || 0), 0);
		const salesByBranch: SalesByBranchStat[] = salesAggregation
			.map((item) => {
				// Преобразуем ObjectId в строку для поиска в Map
				const branchIdStr = String(item._id);
				const branch = branchesMap.get(branchIdStr);
				return {
					branchId: branchIdStr,
					branchTitle: branch?.title || "Неизвестный склад",
					totalSales: item.totalSales || 0,
					percentage: totalSales > 0 ? (item.totalSales / totalSales) * 100 : 0,
				};
			})
			.sort((a, b) => b.totalSales - a.totalSales); // Сортируем по убыванию суммы

		// 9. СТАТИСТИКА ПО ОБРАБОТКАМ (КОЛИЧЕСТВУ ЗАКАЗОВ) ПО СКЛАДАМ.
		//    Группируем заказы по складу отправления и считаем количество заказов.
		const processingAggregation = await OrderModel.aggregate([
			// Фильтруем заказы по дате, если указаны даты
			...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
			// Фильтруем только заказы, у которых есть склад отправления
			{ $match: { originBranchId: { $ne: null } } },
			// Группируем по складу отправления и считаем количество заказов
			{
				$group: {
					_id: "$originBranchId",
					totalProcessings: { $sum: 1 },
				},
			},
		]);

		// 10. Преобразуем результаты агрегации в удобный формат.
		//     Для каждого склада считаем процент от общего количества обработок.
		const totalProcessings = processingAggregation.reduce((sum, item) => sum + (item.totalProcessings || 0), 0);
		const processingByBranch: ProcessingByBranchStat[] = processingAggregation
			.map((item) => {
				// Преобразуем ObjectId в строку для поиска в Map
				const branchIdStr = String(item._id);
				const branch = branchesMap.get(branchIdStr);
				return {
					branchId: branchIdStr,
					branchTitle: branch?.title || "Неизвестный склад",
					totalProcessings: item.totalProcessings || 0,
					percentage: totalProcessings > 0 ? (item.totalProcessings / totalProcessings) * 100 : 0,
				};
			})
			.sort((a, b) => b.totalProcessings - a.totalProcessings); // Сортируем по убыванию количества

		// 11. Возвращаем статистику в формате JSON.
		//     Фронтенд получит эти данные и отобразит их в виде таблиц и диаграмм.
		return NextResponse.json({
			salesByBranch,
			processingByBranch,
		});
	} catch (error) {
		console.error("dashboard stats error", error);
		return NextResponse.json({ message: "Ошибка получения статистики" }, { status: 500 });
	}
}
