import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel, StatusEnToRu } from "@/mongodb/models/orderModel";
import { BranchModel } from "@/mongodb/models/branchModel";

// API endpoint для получения сводных данных по заказам.
// Этот endpoint доступен только для администраторов.
// Возвращает агрегированные данные: общее количество заказов, сумма, вес, статистика по статусам и складам.
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

		// 4. Получаем параметры фильтрации по датам из URL.
		const { searchParams } = new URL(request.url);
		const dateFrom = searchParams.get("dateFrom");
		const dateTo = searchParams.get("dateTo");

		// 5. Строим фильтр для заказов по дате создания.
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

		// 6. Получаем общее количество заказов.
		const totalOrders = await OrderModel.countDocuments(dateFilter);

		// 7. Получаем общую сумму продаж (products_total_cost).
		const salesAggregation = await OrderModel.aggregate([
			...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
			{
				$group: {
					_id: null,
					totalSales: { $sum: "$products_total_cost" },
				},
			},
		]);
		const totalSales = salesAggregation.length > 0 ? salesAggregation[0].totalSales || 0 : 0;

		// 8. Получаем общий вес всех заказов.
		const weightAggregation = await OrderModel.aggregate([
			...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
			{
				$group: {
					_id: null,
					totalWeight: { $sum: "$weight" },
				},
			},
		]);
		const totalWeight = weightAggregation.length > 0 ? weightAggregation[0].totalWeight || 0 : 0;

		// 9. Получаем статистику по статусам заказов.
		const statusAggregation = await OrderModel.aggregate([
			...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
				},
			},
		]);
		const ordersByStatus = statusAggregation.map((item) => ({
			status: StatusEnToRu[item._id as keyof typeof StatusEnToRu] || item._id,
			count: item.count,
			percentage: totalOrders > 0 ? (item.count / totalOrders) * 100 : 0,
		}));

		// 10. Получаем статистику по складам (originBranchId).
		const branchAggregation = await OrderModel.aggregate([
			...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
			{ $match: { originBranchId: { $ne: null } } },
			{
				$group: {
					_id: "$originBranchId",
					count: { $sum: 1 },
				},
			},
		]);

		// 11. Получаем названия складов.
		const branches = await BranchModel.find().lean();
		const branchesMap = new Map(branches.map((b) => [String(b._id), b]));

		const ordersByBranch = branchAggregation.map((item) => {
			const branch = branchesMap.get(String(item._id));
			return {
				branchTitle: branch?.title || "Неизвестный склад",
				count: item.count,
				percentage: totalOrders > 0 ? (item.count / totalOrders) * 100 : 0,
			};
		});

		// 12. Возвращаем сводные данные в формате JSON.
		return NextResponse.json({
			totalOrders,
			totalSales,
			totalWeight,
			ordersByStatus,
			ordersByBranch,
		});
	} catch (error) {
		console.error("summary report error", error);
		return NextResponse.json({ message: "Ошибка получения сводки" }, { status: 500 });
	}
}
