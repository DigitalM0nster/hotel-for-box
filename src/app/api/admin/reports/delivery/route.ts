import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
import { BranchModel } from "@/mongodb/models/branchModel";
import { BagModel } from "@/mongodb/models/bagModel";
import { FlightModel } from "@/mongodb/models/flightModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IOrder } from "@/mongodb/models/orderModel";

// API endpoint для получения агрегированного отчёта по доставке.
// Этот endpoint доступен только для администраторов.
// Группирует заказы по рейсам, складам отправления и способам доставки.
// Возвращает агрегированные данные: количество посылок, mailbox, вес, суммы по способам оплаты.
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
		const departmentFromId = searchParams.get("departmentFromId");
		const nameFilter = searchParams.get("name"); // Поиск по рейсу или имени

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

		// Фильтр по складу отправления
		if (departmentFromId) {
			// Преобразуем строку в ObjectId для корректного поиска
			dateFilter.originBranchId = departmentFromId;
		}

		// 6. Получаем все заказы с фильтрацией.
		const ordersDocs = await OrderModel.find(dateFilter).lean();

		// 7. Получаем все склады для отображения названий.
		const branches = await BranchModel.find().lean();
		const branchesMap = new Map(branches.map((b) => [String(b._id), b]));

		// 8. Получаем все мешки для связи заказов с рейсами.
		const bags = await BagModel.find().lean();
		const bagsMap = new Map(bags.map((b) => [String(b._id), b]));

		// 9. Получаем все рейсы для отображения кодов.
		const flights = await FlightModel.find().lean();
		const flightsMap = new Map(flights.map((f) => [String(f._id), f]));

		// 10. Группируем заказы по ключу: flightCode + originBranchId + deliveryMethod
		//     Ключ формируется так: "flightCode|originBranchId|deliveryMethod"
		const groupsMap = new Map<
			string,
			{
				createdAt: Date;
				flightCode: string | null;
				originBranchId: string | null;
				deliveryMethod: string;
				orders: IOrder[];
			}
		>();

		normalizeDbRes<IOrder[]>(ordersDocs).forEach((order) => {
			// Получаем код рейса через bagId -> bag -> flightId -> flight
			let flightCode: string | null = null;
			if (order.bagId) {
				const bag = bagsMap.get(String(order.bagId));
				if (bag && bag.flightId) {
					const flight = flightsMap.get(String(bag.flightId));
					if (flight) {
						flightCode = flight.code;
					}
				}
			}

			// Получаем способ доставки из снимка адреса
			const deliveryMethod = order.adressSnapshot?.deliveryMethod || "warehouse";

			// Формируем ключ группы
			const groupKey = `${flightCode || "no-flight"}|${order.originBranchId || "no-branch"}|${deliveryMethod}`;

			if (!groupsMap.has(groupKey)) {
				groupsMap.set(groupKey, {
					createdAt: order.createdAt || new Date(),
					flightCode,
					originBranchId: order.originBranchId ? String(order.originBranchId) : null,
					deliveryMethod,
					orders: [],
				});
			}

			groupsMap.get(groupKey)!.orders.push(order);
		});

		// 11. Преобразуем группы в формат отчёта.
		const items = Array.from(groupsMap.values()).map((group) => {
			const orders = group.orders;

			// Количество посылок (заказов)
			const packages = orders.length;

			// Количество уникальных mailbox
			const uniqueMailboxes = new Set(orders.map((o) => o.h4b_us_id).filter(Boolean));
			const mailboxes = uniqueMailboxes.size;

			// Суммарный вес
			const weight = orders.reduce((sum, o) => sum + (o.weight || 0), 0);

			// Количество объединённых заказов (с groupId)
			const combined = orders.filter((o) => o.groupId).length;

			// Количество разделённых заказов (пока 0, логику нужно доработать)
			const splited = 0;

			// Получаем название склада отправления
			const originBranch = group.originBranchId ? branchesMap.get(String(group.originBranchId)) : null;
			const departmentFrom = originBranch?.title || "-";

			// Переводим способ доставки в читаемый формат
			const shipmentMethodLabels: Record<string, string> = {
				warehouse: "Склад",
				courier: "Курьер",
			};
			const shipmentMethod = shipmentMethodLabels[group.deliveryMethod] || group.deliveryMethod;

			// Агрегируем суммы по способам оплаты
			const amounts = {
				total: 0,
				toCollect: 0, // К сбору (order_coast - paid)
				authorize: 0,
				points: 0,
				tdb: 0,
				cod: 0, // Cash on Delivery
				collect: 0,
				card: 0,
				cash: 0,
				standart: 0,
			};

			orders.forEach((order) => {
				const orderCoast = order.order_coast || 0;
				const paid = order.paid || 0;

				amounts.total += orderCoast;
				amounts.toCollect += Math.max(0, orderCoast - paid);

				// Определяем способ оплаты по paymentInfo.provider
				const provider = order.paymentInfo?.provider || "";
				if (provider === "yookassa") {
					amounts.authorize += paid;
				} else if (provider === "manual") {
					amounts.cash += paid;
				} else {
					// Для других способов (other и неизвестных)
					amounts.standart += paid;
				}
			});

			return {
				createdAt: group.createdAt,
				flightCode: group.flightCode || "-",
				departmentFrom,
				shipmentMethod,
				packages,
				mailboxes,
				weight,
				splited,
				combined,
				amounts,
			};
		});

		// 12. Фильтруем по имени (рейсу), если указан фильтр
		let filteredItems = items;
		if (nameFilter) {
			const nameLower = nameFilter.toLowerCase();
			filteredItems = items.filter(
				(item) =>
					(item.flightCode && item.flightCode !== "-" && item.flightCode.toLowerCase().includes(nameLower)) ||
					(item.departmentFrom && item.departmentFrom !== "-" && item.departmentFrom.toLowerCase().includes(nameLower))
			);
		}

		// 13. Сортируем по дате создания (новые первыми)
		filteredItems.sort((a, b) => {
			const dateA = new Date(a.createdAt).getTime();
			const dateB = new Date(b.createdAt).getTime();
			return dateB - dateA;
		});

		// 14. Возвращаем данные отчёта в формате JSON.
		return NextResponse.json({
			items: filteredItems,
			total: filteredItems.length,
		});
	} catch (error) {
		console.error("delivery report error", error);
		return NextResponse.json({ message: "Ошибка получения отчёта по доставке" }, { status: 500 });
	}
}
