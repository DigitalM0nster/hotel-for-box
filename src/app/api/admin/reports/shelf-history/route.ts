import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IOrder } from "@/mongodb/models/orderModel";

// API endpoint для получения истории полок.
// Этот endpoint доступен только для администраторов.
// Возвращает историю изменений полок для заказов из поля history.
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

		// Фильтруем только заказы, у которых есть история
		// Для фильтрации по полкам в истории используем $elemMatch
		// Проверяем, что есть хотя бы одна запись истории с непустой полкой
		dateFilter.history = {
			$exists: true,
			$ne: [],
			$elemMatch: {
				$and: [{ shelf: { $exists: true } }, { shelf: { $ne: null } }, { shelf: { $ne: "" } }],
			},
		};

		// 6. Получаем все заказы с историей изменений полок.
		//    Сортировка по дате создания заказа (историю отсортируем после обработки)
		const ordersDocs = await OrderModel.find(dateFilter).sort({ createdAt: -1 }).lean();

		// 7. Преобразуем данные заказов в формат отчёта.
		//    Для каждого заказа извлекаем записи истории, где менялась полка.
		const items: Array<{
			orderId: string;
			currentShelf: string;
			historyEntry: {
				shelf: string;
				userName: string;
				case: string;
				createdAt: Date;
			};
		}> = [];

		normalizeDbRes<IOrder[]>(ordersDocs).forEach((order) => {
			if (!order.history || order.history.length === 0) return;

			// Находим все записи истории, где менялась полка
			order.history.forEach((historyEntry) => {
				if (historyEntry.shelf) {
					items.push({
						orderId: order.orderId || String(order._id).slice(-6),
						currentShelf: order.shelf || "-",
						historyEntry: {
							shelf: historyEntry.shelf,
							userName: historyEntry.userName || "-",
							case: historyEntry.case || "-",
							createdAt: historyEntry.createdAt || new Date(),
						},
					});
				}
			});
		});

		// Сортируем по дате изменения (новые первыми)
		items.sort((a, b) => {
			const dateA = new Date(a.historyEntry.createdAt).getTime();
			const dateB = new Date(b.historyEntry.createdAt).getTime();
			return dateB - dateA;
		});

		// 8. Возвращаем данные отчёта в формате JSON.
		return NextResponse.json({
			items,
			total: items.length,
		});
	} catch (error) {
		console.error("shelf history report error", error);
		return NextResponse.json({ message: "Ошибка получения истории полок" }, { status: 500 });
	}
}
