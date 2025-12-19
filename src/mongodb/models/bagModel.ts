import { model, Model, models, Schema, Types, Document } from "mongoose";

// Интерфейс мешка/багажа.
// Мешок — это физическая единица груза, в которую складываются несколько заказов.
// Мешки привязываются к рейсам для транспортировки между складами/странами.
export interface IBag {
	_id?: string;

	// Человекочитаемое имя мешка, например "Exp-Dec182025-4040"
	name: string;

	// Общий вес мешка в килограммах
	// Это сумма весов всех заказов, которые находятся в мешке
	weightKg: number;

	// Ссылка на рейс, к которому привязан мешок
	// Может быть null, если мешок ещё не привязан к рейсу
	flightId?: Types.ObjectId | null;

	// Список orderId заказов, которые находятся в этом мешке
	// Используем orderId (человекочитаемый ID), а не _id
	orderIds: string[];

	// Количество заказов в мешке (вычисляемое поле, можно получать через orderIds.length)
	ordersCount?: number;

	// Описание мешка (для администратора)
	admin_description?: string | null;

	createdAt?: Date;
	updatedAt?: Date;
}

// Для Mongo-документа исключаем только технические поля
export interface IBagDocument extends Omit<IBag, "_id">, Document {}

const bagSchema = new Schema<IBagDocument>(
	{
		// Имя мешка (обязательное поле, уникальное)
		name: { type: String, required: true, unique: true, index: true },

		// Общий вес мешка в килограммах
		weightKg: { type: Number, required: true, default: 0 },

		// Ссылка на рейс (может быть null, если мешок ещё не привязан)
		flightId: { type: Schema.Types.ObjectId, ref: "Flight", default: null },

		// Список orderId заказов в мешке
		// Массив строк с orderId заказов
		orderIds: [{ type: String, required: true }],

		// Описание для администратора
		admin_description: { type: String, default: null },

		createdAt: { type: Date, default: Date.now },
	},
	{
		versionKey: false,
		timestamps: true, // Автоматически добавляет createdAt и updatedAt
	}
);

// Экспортируем модель Bag
export const BagModel: Model<IBagDocument> = models?.Bag || model<IBagDocument>("Bag", bagSchema);
