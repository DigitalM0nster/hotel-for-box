import { model, Model, models, Schema, Types } from "mongoose";
import { IUser } from "./userModel";

export const StatusEnToRu = {
	Created: "Создано",
	Arrived: "Прибыло",
	"Shipping approved": "Отправка одобрена",
	"Shipping paid": "Оплата доставки произведена",
	Departed: "Отправлено",
	Delivered: "Доставлено",
	Received: "Получено",
	Return: "Возврат",
	Cancelled: "Отменено",
} as const;

export type IOrderStatus = keyof typeof StatusEnToRu;

// Вложенный тип товара внутри заказа.
// Это "снепшот" товара на момент создания/редактирования заказа.
export interface IOrderProduct {
	_id?: string;
	name: string;
	brand: string;
	category: string;
	size: string;
	color: string;
	price: number;
	quantity: number;
	weight: number;
	width_x: number;
	height_y: number;
	depth_z: number;
}

export interface IOrder {
	_id?: string;

	// Наш человекочитаемый ID заказа для отображения в интерфейсе.
	// Короткий числовой номер, понятный админам и пользователю (например, "000123").
	orderId?: string | null;

	// ID заказа на другом сайте (то, что в таблице "Order ID").
	externalOrderId?: string | null;

	// Отделение/склад, откуда посылка отправляется в нашу зоне ответственности.
	// В домене: склад в Монголии, откуда отправляем в Россию.
	originBranchId?: Types.ObjectId | null;

	// Отделение/склад, куда посылка приезжает в России.
	// В домене: российский склад назначения перед выдачей/передачей в СДЭК.
	destinationBranchId?: Types.ObjectId | null;

	// Мешок/большая коробка, в который упакован заказ.
	// Это поле пригодится для будущих экранов Bags/Flights.
	bagId?: Types.ObjectId | null;

	userId: Types.ObjectId; // ID  отправитель
	adressId: Types.ObjectId; // ID адрес

	// Снимок пользователя на момент создания/редактирования заказа.
	// Нужен, чтобы при удалении пользователя сохранить информацию о нём в заказах.
	userSnapshot?: {
		publicId?: string | null;
		name: string;
		surname?: string | null;
		patronymic?: string | null;
		email: string;
		phone1: string;
		phone2?: string | null;
		city?: string | null;
		// Флаг, что пользователь был удалён (для отображения "Пользователь удалён")
		isDeleted?: boolean;
	};

	// Снимок адреса на момент создания/редактирования заказа.
	// Нужен, чтобы изменение адреса в адресной книге не меняло старые заказы.
	adressSnapshot?: {
		isBusiness: boolean;
		deliveryMethod: "warehouse" | "courier";
		country: string;
		city: string;
		adress: string;
		zip_code?: string | null;
		phone1: string;
		phone2?: string | null;
		recipientName?: string | null;
		recipientSurname?: string | null;
		recipientPatronymic?: string | null;
		recipientInnNumber?: string | null;
		passportSeriesNumber?: string | null;
		companyName?: string | null;
		admin_description?: string | null;
	};

	// Опции оформления
	isBusiness?: boolean;
	commercialInvoiceUrl?: string | null;
	removeOuterBox?: boolean;
	exporterName?: string | null;
	exporterAddress?: string | null;
	exporterPhone?: string | null;
	exporterInn?: string | null;

	// Группа заказов (для объединения нескольких отправлений)
	groupId?: string | null;

	// Полка на складе, где лежит заказ (Shelf в таблице).
	shelf?: string | null;

	track: string;
	shopUrl: string;
	products_total_cost: number; //Общая стоимость товаров

	description: string; // Описание заказа (заполняет пользователь при создании, может редактировать админ)

	order_coast: number; // Стоимость посылки
	paid: number;

	//Размеры общей  посылки - админ вносит
	width_x: number; // Ширина
	height_y: number; //Высота
	depth_z: number; // Глубина
	//Вес
	weight: number;
	h4b_us_id: string;

	// Информация об оплате в платёжной системе.
	// Нужна для отчётов и понятного статуса оплаты.
	paymentInfo?: {
		provider: "manual" | "yookassa" | "other";
		externalId?: string;
		// Статус, который ставит админ руками (позже может менять сама платёжка).
		// invoice_not_issued  — счёт ещё не выставлен
		// pending             — счёт выставлен, ждём оплату
		// paid                — оплачен
		// failed              — ошибка оплаты
		// refunded            — сделан возврат
		status: "invoice_not_issued" | "pending" | "paid" | "failed" | "refunded";
		paidAt?: Date;
	};

	// Вложения, которые добавляет админ/суперадмин:
	// фото коробок, сканы накладных и т.п.
	attachments?: {
		url: string;
		fileName?: string | null;
		description?: string | null;
		uploadedAt?: Date;
	}[];

	// Товары заказа — теперь храним их прямо внутри документа,
	// а не в отдельной коллекции Product.
	products?: IOrderProduct[];

	// История изменений заказа (для вкладки «История» в админке).
	history?: {
		case: string; // Человекочитаемое описание события, например "Создание заказа", "Обновление статуса".
		createdAt?: Date;
		userName?: string | null;
		department?: string | null;
		shelf?: string | null;
		groupId?: string | null;
		status?: IOrderStatus | null;
	}[];

	status: IOrderStatus;

	createdAt?: Date;
	updatedAt?: Date; // Время последнего обновления (из timestamps)
	//! Виртуальные поля
	user: IUser;
}

// Для Mongo-документа явно исключаем только технические поля и виртуальные связи.
export interface IOrderDocument extends Omit<IOrder, "_id" | "user">, Document {}
const orderSchema = new Schema<IOrderDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		adressId: { type: Schema.Types.ObjectId, ref: "Adress", required: true },

		// Снимок пользователя на момент создания/редактирования заказа.
		// Нужен, чтобы при удалении пользователя сохранить информацию о нём в заказах.
		userSnapshot: {
			publicId: { type: String, default: null },
			name: { type: String, default: null },
			surname: { type: String, default: null },
			patronymic: { type: String, default: null },
			email: { type: String, default: null },
			phone1: { type: String, default: null },
			phone2: { type: String, default: null },
			city: { type: String, default: null },
			isDeleted: { type: Boolean, default: false },
		},

		// Склад/отделение в Монголии, откуда посылка уходит в Россию.
		originBranchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },

		// Склад/отделение в России, куда посылка приезжает перед выдачей клиенту/службе доставки.
		destinationBranchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },

		// Мешок/большая коробка, в который упакован заказ.
		// Пока может быть null — это задел под будущие экраны Bags/Flights.
		bagId: { type: Schema.Types.ObjectId, ref: "Bag", default: null },

		// Снимок адреса, который сохраняем в заказе.
		adressSnapshot: {
			isBusiness: { type: Boolean, default: false },
			deliveryMethod: { type: String, enum: ["warehouse", "courier"], default: "warehouse" },
			country: { type: String, default: null },
			city: { type: String, default: null },
			adress: { type: String, default: null },
			zip_code: { type: String, default: null },
			phone1: { type: String, default: null },
			phone2: { type: String, default: null },
			recipientName: { type: String, default: null },
			recipientSurname: { type: String, default: null },
			recipientPatronymic: { type: String, default: null },
			recipientInnNumber: { type: String, default: null },
			passportSeriesNumber: { type: String, default: null },
			companyName: { type: String, default: null },
			admin_description: { type: String, default: null },
		},
		isBusiness: { type: Boolean, default: false },
		commercialInvoiceUrl: { type: String, default: null },
		removeOuterBox: { type: Boolean, default: false },
		exporterName: { type: String, default: null },
		exporterAddress: { type: String, default: null },
		exporterPhone: { type: String, default: null },
		exporterInn: { type: String, default: null },
		groupId: { type: String, default: null },

		// Полка на складе для этого заказа (Shelf).
		shelf: { type: String, default: null },

		// Храним наш человекочитаемый ID заказа.
		orderId: { type: String, default: null, index: true },

		// Внешний ID заказа на другом сайте (Order ID).
		externalOrderId: { type: String, default: null },

		track: { type: String, required: true },
		shopUrl: { type: String, required: true },

		description: { type: String, required: true },
		h4b_us_id: { type: String, default: null },
		products_total_cost: { type: Number, required: true },
		order_coast: { type: Number, default: null },
		paid: { type: Number, default: null },
		weight: { type: Number, default: null },
		width_x: { type: Number, default: null },
		height_y: { type: Number, default: null },
		depth_z: { type: Number, default: null },

		// Метаданные оплаты в платёжной системе (gateway).
		// По ним строятся отчёты и статус оплаты.
		paymentInfo: {
			provider: {
				type: String,
				enum: ["manual", "yookassa", "other"],
				default: "manual",
			},
			externalId: { type: String, default: null },
			status: {
				type: String,
				enum: ["invoice_not_issued", "pending", "paid", "failed", "refunded"],
				default: "invoice_not_issued",
			},
			paidAt: { type: Date, default: null },
		},

		// Вложения (фотографии, документы и т.д.), которые добавляет админ.
		attachments: [
			{
				url: { type: String, required: true },
				fileName: { type: String, default: null },
				description: { type: String, default: null },
				uploadedAt: { type: Date, default: Date.now },
			},
		],
		// Вложенный массив товаров (снепшот).
		products: [
			{
				name: { type: String, required: true },
				brand: { type: String, default: "" },
				category: { type: String, default: null },
				size: { type: String, default: null },
				color: { type: String, default: null },
				price: { type: Number, required: true },
				quantity: { type: Number, default: 1 },
				weight: { type: Number, default: 0 },
				width_x: { type: Number, default: 0 },
				height_y: { type: Number, default: 0 },
				depth_z: { type: Number, default: 0 },
			},
		],

		// История изменений заказа (для админской вкладки "История").
		history: [
			{
				case: { type: String, required: true },
				createdAt: { type: Date, default: Date.now },
				userName: { type: String, default: null },
				department: { type: String, default: null },
				shelf: { type: String, default: null },
				groupId: { type: String, default: null },
				status: { type: String, default: null },
			},
		],

		status: {
			type: String,
			enum: ["Created", "Arrived", "Shipping approved", "Shipping paid", "Departed", "Delivered", "Received", "Return", "Cancelled"],
			default: "Created",
		},
		createdAt: { type: Date, default: Date.now },
	},
	{
		versionKey: false,
		timestamps: true,
	}
);

orderSchema.virtual("user", {
	ref: "User",
	localField: "userId",
	foreignField: "_id",
	justOne: true,
});

// ✅ Включаем виртуальные поля в JSON и Object
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export const OrderModel = (models?.Order as Model<IOrderDocument>) || model<IOrderDocument>("Order", orderSchema);
