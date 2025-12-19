"use server";

import { auth } from "@/auth";
import { Product } from "@/components/forms/productForm";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { connectDB } from "@/mongodb/connect";
import { AdressModel, IAdress } from "@/mongodb/models/adressModel";
import { IOrder, IOrderStatus, OrderModel, StatusEnToRu } from "@/mongodb/models/orderModel";
import { IUser, UserModel } from "@/mongodb/models/userModel";
import { IActionResult } from "@/types/types";
import { redirect } from "next/navigation";
import crypto from "crypto";

// Генерация человекочитаемого orderId для заказа.
// Формат: ровно 6 цифр, например "000123".
// Это то, что будем показывать как «наш номер заказа» вместо длинного Mongo-ID.
const generateOrderId = async (): Promise<string> => {
	while (true) {
		// Берём случайные байты, переводим в число и сжимаем до диапазона 0..999999.
		const randomBytes = crypto.randomBytes(4).toString("hex");
		const asNumber = parseInt(randomBytes, 16);
		const digits = (asNumber % 1_000_000).toString().padStart(6, "0");
		const candidate = digits;

		// Проверяем, что такого orderId ещё нет в базе.
		// Если когда‑то понадобится сделать его строго уникальным, можно
		// добавить unique-индекс на поле orderId.
		const exists = await OrderModel.exists({ orderId: candidate });
		if (!exists) return candidate;
	}
};

interface CreateProps {
	shopUrl: string;
	track: string;
	products_total_cost: number;
	userId: string;
	adressId: string;
	description: string;
	products: Product[];
	isBusiness?: boolean;
	commercialInvoiceUrl?: string | null;
	removeOuterBox?: boolean;
	exporterName?: string | null;
	exporterAddress?: string | null;
	exporterPhone?: string | null;
	exporterInn?: string | null;
	destinationBranchId?: string | null;
}

// Результат создания/обновления заказа
export interface CreateOrderResult {
	success: boolean;
	orderId?: string;
	error?: string;
}

export async function createOrder(props: CreateProps): Promise<CreateOrderResult> {
	const { products, ...orderProps } = props;
	console.log("CREATE", props);
	try {
		await connectDB();

		// Загружаем адрес из базы и создаём снимок на момент создания заказа.
		const adress = await AdressModel.findById(orderProps.adressId).lean<IAdress | null>();
		if (!adress) {
			return { success: false, error: "Адрес не найден" };
		}

		if (String(adress.userId) !== orderProps.userId) {
			return { success: false, error: "Вы не можете использовать этот адрес" };
		}

		// Загружаем пользователя и создаём снимок на момент создания заказа.
		const user = await UserModel.findById(orderProps.userId).lean<IUser | null>();
		if (!user) {
			return { success: false, error: "Пользователь не найден" };
		}

		const adressSnapshot = {
			isBusiness: adress.isBusiness,
			deliveryMethod: adress.deliveryMethod,
			country: adress.country,
			city: adress.city,
			adress: adress.adress,
			zip_code: adress.zip_code ?? null,
			phone1: adress.phone1,
			phone2: adress.phone2 ?? null,
			recipientName: adress.recipientName ?? null,
			recipientSurname: adress.recipientSurname ?? null,
			recipientPatronymic: adress.recipientPatronymic ?? null,
			recipientInnNumber: adress.recipientInnNumber ?? null,
			passportSeriesNumber: adress.passportSeriesNumber ?? null,
			companyName: adress.companyName ?? null,
			admin_description: adress.admin_description ?? null,
		};

		const userSnapshot = {
			publicId: user.publicId ?? null,
			name: user.name,
			surname: user.surname ?? null,
			patronymic: user.patronymic ?? null,
			email: user.email,
			phone1: user.phone1,
			phone2: user.phone2 ?? null,
			city: user.city ?? null,
			isDeleted: false,
		};

		const order = new OrderModel();

		// Копируем "основные" поля заказа и товары как вложенный массив.
		// Важно: не копируем orderId из orderProps, если он там есть - мы сгенерируем его сами
		const { orderId: _, ...orderPropsWithoutId } = orderProps as any;
		Object.assign(order, orderPropsWithoutId, { adressSnapshot, userSnapshot, products });

		// Если указано отделение получения (для доставки до склада), сохраняем его.
		if (orderProps.destinationBranchId) {
			order.destinationBranchId = orderProps.destinationBranchId as unknown as typeof order.destinationBranchId;
		}

		// Всегда генерируем новый orderId при создании заказа (если его ещё нет).
		// Это гарантирует, что у каждого нового заказа будет человекочитаемый ID.
		if (!order.orderId) {
			order.orderId = await generateOrderId();
			console.log("🔢 Генерируем orderId для нового заказа:", order.orderId);
		}

		// Добавляем первую запись в историю: создание заказа.
		const history = (order as any).history || [];
		history.push({
			case: "Создание заказа",
			createdAt: new Date(),
			status: "Created",
		});
		(order as any).history = history;

		// Сохраняем заказ в базу данных
		await order.save();

		// Проверяем, что orderId действительно сохранился
		if (!order.orderId) {
			console.error("❌ ОШИБКА: orderId не был сохранён после save()!");
			// Пытаемся сгенерировать и сохранить ещё раз
			order.orderId = await generateOrderId();
			await order.save();
		}

		// После сохранения загружаем заказ заново, чтобы убедиться, что orderId точно есть
		const savedOrder = await OrderModel.findById(order._id);
		const finalOrderId = savedOrder?.orderId || order.orderId;

		if (!finalOrderId) {
			console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: orderId отсутствует даже после перезагрузки!");
			return { success: false, error: "Не удалось создать orderId для заказа" };
		}

		console.log("CREATED ✅", order._id, "orderId:", finalOrderId);
		// Возвращаем человекочитаемый orderId (6 цифр), а не Mongo _id.
		// Это нужно для правильного редиректа на страницу заказа.
		return { success: true, orderId: finalOrderId };
	} catch (error) {
		console.log("Error 📛", error);
		const message = error instanceof Error ? error.message : "Не удалось создать заказ, попробуйте ещё раз";
		return { success: false, error: message };
	}
}

// Обновление существующего заказа: меняем поля заказа и полностью пересоздаём товары
interface UpdateProps extends CreateProps {
	orderId: string;
}

export async function updateOrder(props: UpdateProps): Promise<CreateOrderResult> {
	const { orderId, products, ...orderProps } = props;
	console.log("UPDATE", props);
	try {
		await connectDB();

		// Поддерживаем поиск и по orderId (человекочитаемый ID), и по Mongo _id.
		const order = await OrderModel.findOne({
			$or: [{ _id: orderId }, { orderId: orderId }],
		});
		if (!order) {
			return { success: false, error: "Заказ не найден" };
		}

		// Не даём редактировать заказ в статусе "Получено"
		if (order.status === "Received") {
			return { success: false, error: "Нельзя редактировать заказ со статусом «Получено»" };
		}

		// На всякий случай проверим, что заказ принадлежит тому же пользователю
		if (String(order.userId) !== orderProps.userId) {
			return { success: false, error: "Вы не можете редактировать этот заказ" };
		}

		// Загружаем актуальную версию адреса и обновляем снимок в заказе.
		const adress = await AdressModel.findById(orderProps.adressId).lean<IAdress | null>();
		if (!adress) {
			return { success: false, error: "Адрес не найден" };
		}

		if (String(adress.userId) !== orderProps.userId) {
			return { success: false, error: "Вы не можете использовать этот адрес" };
		}

		// Загружаем актуальную версию пользователя и обновляем снимок в заказе.
		const user = await UserModel.findById(orderProps.userId).lean<IUser | null>();
		if (!user) {
			return { success: false, error: "Пользователь не найден" };
		}

		const adressSnapshot = {
			isBusiness: adress.isBusiness,
			deliveryMethod: adress.deliveryMethod,
			country: adress.country,
			city: adress.city,
			adress: adress.adress,
			zip_code: adress.zip_code ?? null,
			phone1: adress.phone1,
			phone2: adress.phone2 ?? null,
			recipientName: adress.recipientName ?? null,
			recipientSurname: adress.recipientSurname ?? null,
			recipientPatronymic: adress.recipientPatronymic ?? null,
			recipientInnNumber: adress.recipientInnNumber ?? null,
			passportSeriesNumber: adress.passportSeriesNumber ?? null,
			companyName: adress.companyName ?? null,
			admin_description: adress.admin_description ?? null,
		};

		// Обновляем снимок пользователя только если он ещё не был помечен как удалённый.
		// Если пользователь уже удалён (isDeleted: true), сохраняем существующий снимок.
		const userSnapshot =
			order.userSnapshot?.isDeleted === true
				? order.userSnapshot
				: {
						publicId: user.publicId ?? null,
						name: user.name,
						surname: user.surname ?? null,
						patronymic: user.patronymic ?? null,
						email: user.email,
						phone1: user.phone1,
						phone2: user.phone2 ?? null,
						city: user.city ?? null,
						isDeleted: false,
				  };

		// Обновляем заказ и полностью перезаписываем массив товаров.
		Object.assign(order, orderProps, { adressSnapshot, userSnapshot, products });

		// Ленивая инициализация orderId для старых заказов,
		// у которых это поле ещё не было заполнено.
		if (!order.orderId) {
			order.orderId = await generateOrderId();
		}
		await order.save();

		console.log("UPDATED ✅", order._id, "orderId:", order.orderId);
		// Возвращаем человекочитаемый orderId (6 цифр), а не Mongo _id.
		return { success: true, orderId: order.orderId || order._id.toString() };
	} catch (error) {
		console.log("Update error 📛", error);
		const message = error instanceof Error ? error.message : "Не удалось обновить заказ, попробуйте ещё раз";
		return { success: false, error: message };
	}
}

export async function getUserOrders() {
	try {
		const session = await auth();
		if (!session) throw new Error("Требуется авторизация");
		await connectDB();
		const orders = await OrderModel.find({ userId: session.user.id }).lean<IOrder[]>();
		return normalizeDbRes<IOrder[]>(orders);
	} catch (error) {
		redirect("/login");
	}
}

export async function getOrderById(id: string): Promise<IOrder | null> {
	try {
		await connectDB();

		// Логируем, что ищем
		console.log("🔍 Ищем заказ по ID:", id, "тип:", typeof id);

		// Поддерживаем как технический _id, так и человекочитаемый orderId (короткий числовой ID).
		// Важно: для Mongo _id нужно проверить, что это валидный ObjectId
		const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
		const searchQuery: any = {};

		if (isValidObjectId) {
			// Если это похоже на Mongo ObjectId, ищем по _id
			searchQuery.$or = [{ _id: id }, { orderId: id }];
		} else {
			// Если это не ObjectId, ищем только по orderId (это наш человекочитаемый ID)
			searchQuery.orderId = id;
		}

		console.log("🔍 Поисковый запрос:", JSON.stringify(searchQuery));

		// Пытаемся получить пользователя через populate, но если пользователь удалён, populate вернёт null
		// В этом случае мы будем использовать userSnapshot из заказа
		const orderDoc = await OrderModel.findOne(searchQuery).populate<{ user: IUser | null }>("user");

		if (!orderDoc) {
			console.log("❌ Заказ не найден по ID:", id);
			return null;
		}

		console.log("✅ Заказ найден:", orderDoc._id, "orderId:", orderDoc.orderId);

		// Ленивая миграция: если у заказа ещё нет orderId, генерируем его и сохраняем.
		// Это нужно, чтобы старые заказы тоже получили человекочитаемый ID.
		if (!orderDoc.orderId) {
			console.log("🔄 Генерируем orderId для старого заказа");
			orderDoc.orderId = await generateOrderId();
			await orderDoc.save();
			console.log("✅ orderId сгенерирован:", orderDoc.orderId);
		}

		const order = normalizeDbRes<IOrder>(orderDoc);
		return order;
	} catch (error) {
		console.log("❌ERROR❌ при поиске заказа:", error);
		return null;
	}
}

// Удаление заказа (только для суперадмина).
// На человеческом языке:
// - Проверяем, что текущий пользователь — суперадмин.
// - Находим заказ по ID (поддерживаем и orderId, и Mongo _id).
// - Удаляем заказ из базы данных.
// - Возвращаем результат операции.
export async function deleteOrderBySuperAdmin(orderId: string): Promise<IActionResult> {
	try {
		const session = await auth();
		if (!session || session.user.role !== "super") {
			return { type: "error", message: "Удаление заказов доступно только суперадмину" };
		}

		await connectDB();

		// Поддерживаем поиск и по orderId, и по Mongo _id.
		const order = await OrderModel.findOne({
			$or: [{ _id: orderId }, { orderId: orderId }],
		});

		if (!order) {
			return { type: "error", message: "Заказ не найден" };
		}

		// Удаляем заказ из базы данных.
		await OrderModel.findByIdAndDelete(order._id);

		return { type: "success", message: "Заказ успешно удалён" };
	} catch (error) {
		console.log("❌ERROR при удалении заказа❌", error);
		return { type: "error", message: "Не удалось удалить заказ" };
	}
}

export async function changeOrderStatus(id: string, status: string): Promise<IActionResult> {
	try {
		await connectDB();
		// Поддерживаем поиск и по orderId (человекочитаемый ID), и по Mongo _id.
		const order = await OrderModel.findOne({
			$or: [{ _id: id }, { orderId: id }],
		});
		if (!order) {
			return { type: "error", message: "Заказ не найден" };
		}
		await OrderModel.findByIdAndUpdate(order._id, { status });
		return {
			type: "success",
			message: `Статус изменен на  "${status}"-"${StatusEnToRu[status]}"`,
		};
	} catch (error) {
		return { type: "error", message: "Ошибка обновления стастуса" };
	}
}

// -------------------------------
// ОБНОВЛЕНИЕ ЗАКАЗА ИЗ АДМИНКИ
// -------------------------------

type UpdateOrderByAdminPayload = {
	orderId: string;
	// Логистика и общая информация.
	track?: string;
	shopUrl?: string;
	externalOrderId?: string | null;
	order_coast?: number;
	paid?: number;
	weight?: number;
	width_x?: number;
	height_y?: number;
	depth_z?: number;
	shelf?: string | null;
	originBranchId?: string | null;
	destinationBranchId?: string | null;
	description?: string;
};

export async function updateOrderByAdmin(payload: UpdateOrderByAdminPayload): Promise<IActionResult> {
	try {
		await connectDB();

		// Поддерживаем поиск и по orderId (человекочитаемый ID), и по Mongo _id.
		const order = await OrderModel.findOne({
			$or: [{ _id: payload.orderId }, { orderId: payload.orderId }],
		});
		if (!order) {
			return { type: "error", message: "Заказ не найден" };
		}

		// Обновляем только те поля, которые пришли в payload.
		if (typeof payload.track === "string") order.track = payload.track;
		if (typeof payload.shopUrl === "string") order.shopUrl = payload.shopUrl;
		if (payload.externalOrderId !== undefined) {
			order.externalOrderId = payload.externalOrderId ?? null;
		}

		if (payload.order_coast !== undefined) order.order_coast = payload.order_coast;
		if (payload.paid !== undefined) order.paid = payload.paid;

		if (payload.weight !== undefined) order.weight = payload.weight;
		if (payload.width_x !== undefined) order.width_x = payload.width_x;
		if (payload.height_y !== undefined) order.height_y = payload.height_y;
		if (payload.depth_z !== undefined) order.depth_z = payload.depth_z;

		if (payload.shelf !== undefined) order.shelf = payload.shelf ?? null;

		if (payload.originBranchId !== undefined) {
			order.originBranchId = payload.originBranchId ? (payload.originBranchId as unknown as typeof order.originBranchId) : null;
		}

		if (payload.destinationBranchId !== undefined) {
			order.destinationBranchId = payload.destinationBranchId ? (payload.destinationBranchId as unknown as typeof order.destinationBranchId) : null;
		}

		if (payload.description !== undefined) {
			order.description = payload.description;
		}

		// Фиксируем событие в истории.
		const session = await auth().catch(() => null);
		const actorName = session?.user?.email || session?.user?.name || "Администратор";
		const history = (order as any).history || [];
		history.push({
			case: "Обновлены данные заказа (логистика/счёт)",
			createdAt: new Date(),
			userName: actorName,
			shelf: order.shelf ?? null,
			groupId: (order as any).groupId ?? null,
			status: order.status,
		});
		(order as any).history = history;

		await order.save();

		return { type: "success", message: "Заказ обновлён" };
	} catch (error) {
		return { type: "error", message: "Не удалось обновить заказ" };
	}
}

type UpdateOrderStatusByAdminPayload = {
	orderId: string;
	status: IOrderStatus;
};

// Эта функция меняет статус заказа по инициативе администратора.
// Здесь можно было бы ввести сложный автомат с переходами,
// но для начала просто запрещаем «откатывать» статус после получения.
export async function updateOrderStatusByAdmin(payload: UpdateOrderStatusByAdminPayload): Promise<IActionResult> {
	try {
		await connectDB();

		// Поддерживаем поиск и по orderId (человекочитаемый ID), и по Mongo _id.
		const order = await OrderModel.findOne({
			$or: [{ _id: payload.orderId }, { orderId: payload.orderId }],
		});
		if (!order) {
			return { type: "error", message: "Заказ не найден" };
		}

		// Если заказ в статусе Received, считаем, что история закончена.
		if (order.status === "Received") {
			return { type: "error", message: "Нельзя менять статус заказа со статусом «Получено»" };
		}

		order.status = payload.status;

		// Фиксируем изменение статуса в истории.
		const session = await auth().catch(() => null);
		const actorName = session?.user?.email || session?.user?.name || "Администратор";
		const history = (order as any).history || [];
		history.push({
			case: "Изменён статус заказа",
			createdAt: new Date(),
			userName: actorName,
			status: payload.status,
		});
		(order as any).history = history;

		await order.save();

		return {
			type: "success",
			message: `Статус изменён на "${payload.status}" - "${StatusEnToRu[payload.status]}"`,
		};
	} catch (error) {
		return { type: "error", message: "Не удалось изменить статус заказа" };
	}
}

type UpdateOrderPaymentInfoPayload = {
	orderId: string;
	provider?: "manual" | "yookassa" | "other";
	externalId?: string | null;
	// Статус платежа, который сейчас ставит админ руками.
	status?: "invoice_not_issued" | "pending" | "paid" | "failed" | "refunded";
	// Сколько всего оплачено по заказу (paid).
	// Мы не ведём отдельные «частичные» платежи, просто фиксируем итог.
	paid?: number | null;
};

// Вложение, которое хранится внутри заказа.
type OrderAttachmentPayload = {
	url: string;
	fileName?: string | null;
	description?: string | null;
};

// Обновляем блок paymentInfo у заказа.
// На человеческом языке:
// - provider: через какую платёжку прошла оплата (в отчётах это «тип оплаты»);
// - externalId: ID транзакции в той системе;
// - status: состояние платежа (успешен, в ожидании, ошибка, возврат);
// - paidAt: дата, когда деньги реально пришли (мы проставляем её автоматически при статусе "paid");
export async function updateOrderPaymentInfo(payload: UpdateOrderPaymentInfoPayload): Promise<IActionResult> {
	try {
		await connectDB();

		// Поддерживаем поиск и по orderId (человекочитаемый ID), и по Mongo _id.
		const order = await OrderModel.findOne({
			$or: [{ _id: payload.orderId }, { orderId: payload.orderId }],
		});
		if (!order) {
			return { type: "error", message: "Заказ не найден" };
		}

		// Инициализируем paymentInfo, если его раньше не было.
		if (!order.paymentInfo) {
			order.paymentInfo = {
				provider: "manual",
				status: "invoice_not_issued",
			} as NonNullable<IOrder["paymentInfo"]>;
		}

		const paymentInfo = order.paymentInfo as NonNullable<IOrder["paymentInfo"]>;

		if (payload.provider) {
			paymentInfo.provider = payload.provider;
		}

		if (payload.status) {
			paymentInfo.status = payload.status;

			// Если статус стал "paid" и даты оплаты ещё нет — фиксируем текущий момент.
			if (payload.status === "paid" && !paymentInfo.paidAt) {
				paymentInfo.paidAt = new Date();
			}
		}

		if (payload.externalId !== undefined) {
			paymentInfo.externalId = payload.externalId ?? undefined;
		}

		// Если админ задал итоговую сумму оплат — просто фиксируем её.
		if (payload.paid !== undefined) {
			order.paid = payload.paid ?? 0;
		}

		// Фиксируем обновление оплаты в истории.
		const session = await auth().catch(() => null);
		const actorName = session?.user?.email || session?.user?.name || "Администратор";
		const history = (order as any).history || [];
		history.push({
			case: "Обновлены платёжные данные",
			createdAt: new Date(),
			userName: actorName,
			status: paymentInfo.status,
		});
		(order as any).history = history;

		await order.save();

		return { type: "success", message: "Платёжная информация обновлена" };
	} catch (error) {
		return { type: "error", message: "Не удалось обновить платёжные данные" };
	}
}

// Обновление вложений (фото, документы и т.п.), которые админ прикрепляет к заказу.
// На человеческом языке:
// - мы принимаем от формы ПОЛНЫЙ список вложений (после редактирования/удаления/добавления),
// - полностью перезаписываем массив attachments в заказе,
// - фиксируем это событие в истории.
export async function updateOrderAttachmentsByAdmin(payload: { orderId: string; attachments: OrderAttachmentPayload[] }): Promise<IActionResult> {
	try {
		await connectDB();

		// Поддерживаем поиск и по orderId (человекочитаемый ID), и по Mongo _id.
		const order = await OrderModel.findOne({
			$or: [{ _id: payload.orderId }, { orderId: payload.orderId }],
		});
		if (!order) {
			return { type: "error", message: "Заказ не найден" };
		}

		// Перезаписываем вложения: пропускаем пустые url на всякий случай.
		const normalizedAttachments =
			payload.attachments
				.filter((att) => att.url && att.url.trim().length > 0)
				.map((att) => ({
					url: att.url.trim(),
					fileName: att.fileName?.trim() || null,
					description: att.description?.trim() || null,
				})) || [];

		(order as any).attachments = normalizedAttachments;

		// Пишем событие в историю.
		const session = await auth().catch(() => null);
		const actorName = session?.user?.email || session?.user?.name || "Администратор";
		const history = (order as any).history || [];
		history.push({
			case: "Обновлены вложения заказа",
			createdAt: new Date(),
			userName: actorName,
			status: order.status,
		});
		(order as any).history = history;

		await order.save();

		return { type: "success", message: "Вложения обновлены" };
	} catch (error) {
		return { type: "error", message: "Не удалось обновить вложения" };
	}
}

// -------------------------------
// СЕРВИС ДЛЯ АДМИНСКОГО СПИСКА ЗАКАЗОВ
// -------------------------------

type GetOrdersForAdminParams = {
	// Номер страницы (считаем от 1).
	page?: number;
	// Количество записей на странице.
	limit?: number;

	// Поле сортировки.
	sortField?: "createdAt" | "status" | "orderId" | "track";
	// Направление сортировки.
	sortDirection?: "asc" | "desc";

	// Фильтр по статусу заказа.
	statusFilter?: IOrderStatus;

	// Фильтр по нашему человеку-читаемому ID заказа (orderId).
	orderIdFilter?: string;

	// Фильтр по внешнему ID заказа (Order ID).
	externalOrderIdFilter?: string;

	// Фильтр по треку.
	trackFilter?: string;

	// Фильтр по группе заказов.
	groupIdFilter?: string;

	// Фильтр по городу (берём город из снимка адреса).
	cityFilter?: string;

	// Диапазон по дате создания заказа (для фильтра Date From / Date To).
	createdFrom?: string;
	createdTo?: string;

	// Способ доставки: доставка до склада / курьер.
	// Берём из снимка адреса adressSnapshot.deliveryMethod.
	shipmentMethodFilter?: "warehouse" | "courier";

	// Фильтр по магазину/отправителю (Shop / Shipper).
	shopFilter?: string;

	// Фильтр по полке на складе.
	shelfFilter?: string;

	// Диапазон по весу заказа (кг).
	weightFrom?: number;
	weightTo?: number;

	// Тип формы: физлицо или бизнес.
	formTypeFilter?: "person" | "business";

	// Статус оплаты счёта на доставку.
	// Рассчитывается по полям order_coast и paid:
	// - "not_paid"    — ещё нет оплат или paid = 0
	// - "partial"     — paid > 0, но меньше order_coast
	// - "full"        — paid >= order_coast
	paidStatusFilter?: "not_paid" | "partial" | "full";

	// Фильтр по складу-отправителю (Монголия).
	departmentFromId?: string;

	// Фильтр по складу-получателю (Россия).
	departmentToId?: string;
};

type GetOrdersForAdminResult = {
	orders: IOrder[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

// Получаем заказы для админского списка с пагинацией, сортировкой и простыми фильтрами.
// Логика похожа на getUsersForAdmin, но проще, чтобы было легче разобраться.
export const getOrdersForAdmin = async (params: GetOrdersForAdminParams = {}): Promise<GetOrdersForAdminResult> => {
	try {
		await connectDB();

		const page = params.page && params.page > 0 ? params.page : 1;
		const limit = params.limit && params.limit > 0 ? params.limit : 50;

		// Разрешаем сортировать по дате создания, статусу, нашему ID заказа и треку.
		const allowedSortField: GetOrdersForAdminParams["sortField"][] = ["createdAt", "status", "orderId", "track"];
		const sortField: GetOrdersForAdminParams["sortField"] = (params.sortField && allowedSortField.includes(params.sortField) && params.sortField) || "createdAt";
		const sortDirection: GetOrdersForAdminParams["sortDirection"] = params.sortDirection === "asc" ? "asc" : "desc";

		const skip = (page - 1) * limit;
		const sort: Record<string, 1 | -1> = {
			[sortField]: sortDirection === "asc" ? 1 : -1,
		};

		// 1. Собираем объект фильтрации.
		const mongoFilter: Record<string, unknown> = {};

		if (params.statusFilter) {
			mongoFilter.status = params.statusFilter;
		}

		if (params.groupIdFilter) {
			mongoFilter.groupId = params.groupIdFilter;
		}

		// Упрощённый помощник для текстовых фильтров (безопасный RegExp).
		const makeRegex = (value?: string) => {
			if (!value || value.trim().length === 0) return null;
			const trimmed = value.trim();
			const escapeRegExp = (source: string) => source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const safeValue = escapeRegExp(trimmed);
			return new RegExp(safeValue, "i");
		};

		const orderIdRegex = makeRegex(params.orderIdFilter);
		if (orderIdRegex) {
			mongoFilter.orderId = orderIdRegex;
		}

		const externalIdRegex = makeRegex(params.externalOrderIdFilter);
		if (externalIdRegex) {
			mongoFilter.externalOrderId = externalIdRegex;
		}

		const trackRegex = makeRegex(params.trackFilter);
		if (trackRegex) {
			mongoFilter.track = trackRegex;
		}

		const cityRegex = makeRegex(params.cityFilter);
		if (cityRegex) {
			mongoFilter["adressSnapshot.city"] = cityRegex;
		}

		const shopRegex = makeRegex(params.shopFilter);
		if (shopRegex) {
			mongoFilter.shopUrl = shopRegex;
		}

		const shelfRegex = makeRegex(params.shelfFilter);
		if (shelfRegex) {
			mongoFilter.shelf = shelfRegex;
		}

		// Фильтр по способу доставки (warehouse / courier) из снимка адреса.
		if (params.shipmentMethodFilter === "warehouse" || params.shipmentMethodFilter === "courier") {
			mongoFilter["adressSnapshot.deliveryMethod"] = params.shipmentMethodFilter;
		}

		// Диапазон по дате создания.
		if (params.createdFrom || params.createdTo) {
			const createdAtFilter: Record<string, Date> = {};
			if (params.createdFrom) {
				// createdFrom приходит в виде YYYY-MM-DD (из searchParams).
				createdAtFilter.$gte = new Date(params.createdFrom);
			}
			if (params.createdTo) {
				// Для верхней границы добавляем конец дня, чтобы включить все заказы этого дня.
				const toDate = new Date(params.createdTo);
				toDate.setHours(23, 59, 59, 999);
				createdAtFilter.$lte = toDate;
			}
			mongoFilter.createdAt = createdAtFilter;
		}

		// Диапазон по весу заказа.
		if (typeof params.weightFrom === "number" || typeof params.weightTo === "number") {
			const weightFilter: Record<string, number> = {};
			if (typeof params.weightFrom === "number") {
				weightFilter.$gte = params.weightFrom;
			}
			if (typeof params.weightTo === "number") {
				weightFilter.$lte = params.weightTo;
			}
			mongoFilter.weight = weightFilter;
		}

		// Тип формы: физлицо / бизнес.
		if (params.formTypeFilter === "person") {
			mongoFilter.isBusiness = { $ne: true };
		} else if (params.formTypeFilter === "business") {
			mongoFilter.isBusiness = true;
		}

		// Статус оплаты счёта.
		if (params.paidStatusFilter) {
			if (params.paidStatusFilter === "not_paid") {
				// Ещё нет оплат или paid = 0.
				mongoFilter.$or = [{ paid: { $exists: false } }, { paid: null }, { paid: 0 }];
			}

			if (params.paidStatusFilter === "partial") {
				// Есть оплата, но меньше, чем выставленный счёт.
				mongoFilter.$and = [
					{ paid: { $gt: 0 } },
					{ order_coast: { $ne: null } },
					{
						$expr: {
							$lt: ["$paid", "$order_coast"],
						},
					},
				];
			}

			if (params.paidStatusFilter === "full") {
				// Оплачено не меньше, чем счёт. Если счёт не задан, сюда не попадаем.
				mongoFilter.$and = [
					{ order_coast: { $ne: null } },
					{ paid: { $ne: null } },
					{
						$expr: {
							$gte: ["$paid", "$order_coast"],
						},
					},
				];
			}
		}

		// Фильтры по отделениям (Монголия/Россия).
		if (params.departmentFromId) {
			mongoFilter.originBranchId = params.departmentFromId;
		}
		if (params.departmentToId) {
			mongoFilter.destinationBranchId = params.departmentToId;
		}

		// 2. Запрашиваем заказы постранично и считаем общее количество.
		const [ordersDocs, total] = await Promise.all([OrderModel.find(mongoFilter).sort(sort).skip(skip).limit(limit), OrderModel.countDocuments(mongoFilter)]);

		// 3. Ленивая миграция orderId: если у старого заказа ещё нет orderId,
		// генерируем его и сохраняем. Так в админке сразу будут человекочитаемые ID.
		for (const doc of ordersDocs) {
			if (!doc.orderId) {
				doc.orderId = await generateOrderId();
				await doc.save();
			}
		}

		const orders = normalizeDbRes<IOrder[]>(ordersDocs);
		const totalPages = Math.max(1, Math.ceil(total / limit));

		return { orders, total, page, limit, totalPages };
	} catch (error) {
		// В случае ошибки отдаём "пустой" результат, чтобы страница не падала.
		return { orders: [], total: 0, page: 1, limit: 50, totalPages: 1 };
	}
};

// -------------------------------
// СЕРВИС ДЛЯ ОБЪЕДИНЕННЫХ ЗАКАЗОВ
// -------------------------------

// Тип для группы объединенных заказов
export type CombinedOrderGroup = {
	groupId: string;
	orders: IOrder[];
	totalWeight: number;
	totalCost: number;
	totalPaid: number;
	ordersCount: number;
	createdAt: Date; // Дата создания самой ранней группы
};

// Генерация человекочитаемого groupId для группы заказов (аналогично generateOrderId)
const generateGroupId = async (): Promise<string> => {
	while (true) {
		const randomBytes = crypto.randomBytes(4).toString("hex");
		const asNumber = parseInt(randomBytes, 16);
		const digits = (asNumber % 1_000_000).toString().padStart(6, "0");
		const candidate = digits;

		// Проверяем, что такого groupId ещё нет в базе
		const exists = await OrderModel.exists({ groupId: candidate });
		if (!exists) return candidate;
	}
};

// Получаем все объединенные заказы, сгруппированные по groupId
export async function getCombinedOrders(): Promise<CombinedOrderGroup[]> {
	try {
		await connectDB();

		// Находим все заказы, у которых есть groupId (они объединены)
		const orders = await OrderModel.find({ groupId: { $ne: null } })
			.populate<{ user: IUser | null }>("user")
			.sort({ createdAt: -1 })
			.lean<IOrder[]>();

		if (orders.length === 0) {
			return [];
		}

		// Сначала выполняем ленивую миграцию: заменяем все UUID groupId на человекочитаемые
		// UUID имеет формат: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 символов или содержит дефисы)
		const uuidGroups = await OrderModel.distinct("groupId", { groupId: { $regex: /-/ } });
		if (uuidGroups.length > 0) {
			console.log(`🔄 Найдено ${uuidGroups.length} групп с UUID, мигрируем на человекочитаемые ID`);
			for (const uuidGroupId of uuidGroups) {
				const newGroupId = await generateGroupId();
				await OrderModel.updateMany({ groupId: uuidGroupId }, { $set: { groupId: newGroupId } });
				console.log("✅ Группа мигрирована:", uuidGroupId, "→", newGroupId);
			}
			// Перезагружаем заказы после миграции
			const updatedOrders = await OrderModel.find({ groupId: { $ne: null } })
				.populate<{ user: IUser | null }>("user")
				.sort({ createdAt: -1 })
				.lean<IOrder[]>();
			orders.splice(0, orders.length, ...updatedOrders);
		}

		// Группируем заказы по groupId
		const groupsMap = new Map<string, IOrder[]>();
		for (const order of orders) {
			const normalizedOrder = normalizeDbRes<IOrder>(order);
			const groupId = normalizedOrder.groupId;
			if (groupId) {
				if (!groupsMap.has(groupId)) {
					groupsMap.set(groupId, []);
				}
				groupsMap.get(groupId)!.push(normalizedOrder);
			}
		}

		// Преобразуем Map в массив групп с подсчетом статистики
		const groups: CombinedOrderGroup[] = Array.from(groupsMap.entries()).map(([groupId, groupOrders]) => {
			// Сортируем заказы в группе по дате создания
			groupOrders.sort((a, b) => {
				const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return dateA - dateB;
			});

			// Подсчитываем общую статистику по группе
			const totalWeight = groupOrders.reduce((sum, order) => {
				return sum + (typeof order.weight === "number" && !isNaN(order.weight) ? order.weight : 0);
			}, 0);

			const totalCost = groupOrders.reduce((sum, order) => {
				return sum + (typeof order.order_coast === "number" && !isNaN(order.order_coast) ? order.order_coast : 0);
			}, 0);

			const totalPaid = groupOrders.reduce((sum, order) => {
				return sum + (typeof order.paid === "number" && !isNaN(order.paid) ? order.paid : 0);
			}, 0);

			// Находим самую раннюю дату создания в группе
			const earliestDate = groupOrders.reduce((earliest, order) => {
				if (!order.createdAt) return earliest;
				const orderDate = new Date(order.createdAt);
				return !earliest || orderDate < earliest ? orderDate : earliest;
			}, null as Date | null);

			return {
				groupId,
				orders: groupOrders,
				totalWeight,
				totalCost,
				totalPaid,
				ordersCount: groupOrders.length,
				createdAt: earliestDate || new Date(),
			};
		});

		// Сортируем группы по дате создания (самые новые первыми)
		groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		return groups;
	} catch (error) {
		console.error("getCombinedOrders error", error);
		return [];
	}
}
