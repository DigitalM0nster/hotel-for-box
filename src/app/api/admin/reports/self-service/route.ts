import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel, StatusEnToRu } from "@/mongodb/models/orderModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IOrder } from "@/mongodb/models/orderModel";

// API endpoint для получения отчёта по самообслуживанию.
// Этот endpoint доступен только для администраторов.
// Возвращает заказы, которые клиенты могут забрать самостоятельно со склада
// (заказы с deliveryMethod === "warehouse" и указанной полкой).
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

		// 5. Строим фильтр для заказов.
		//    Фильтруем по deliveryMethod === "warehouse" (самовывоз со склада)
		//    и по наличию полки (shelf не пустая).
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

		// Фильтр для самообслуживания: способ доставки "warehouse" и есть полка
		dateFilter["adressSnapshot.deliveryMethod"] = "warehouse";
		// Фильтр по полке: существует и не пустая строка (существование автоматически исключает null)
		dateFilter.shelf = { $exists: true, $ne: "" };

		// 6. Получаем все заказы на самообслуживании.
		const ordersDocs = await OrderModel.find(dateFilter).sort({ createdAt: -1 }).lean();

		// 7. Преобразуем данные заказов в формат отчёта.
		const orders = normalizeDbRes<IOrder[]>(ordersDocs).map((order) => {
			// Получаем имя пользователя из снимка
			const userName = order.userSnapshot ? [order.userSnapshot.name, order.userSnapshot.surname, order.userSnapshot.patronymic].filter(Boolean).join(" ") : "-";

			return {
				_id: String(order._id),
				orderId: order.orderId || "",
				shelf: order.shelf || "-",
				h4b_us_id: order.h4b_us_id || "-",
				userName,
				userEmail: order.userSnapshot?.email || "-",
				userPhone: order.userSnapshot?.phone1 || "-",
				status: StatusEnToRu[order.status] || order.status,
				createdAt: order.createdAt || new Date(),
			};
		});

		// 8. Возвращаем данные отчёта в формате JSON.
		return NextResponse.json({
			orders,
			total: orders.length,
		});
	} catch (error) {
		console.error("self-service report error", error);
		return NextResponse.json({ message: "Ошибка получения отчёта по самообслуживанию" }, { status: 500 });
	}
}
