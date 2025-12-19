import { model, Model, models, Schema, Types, Document } from "mongoose";

// Статусы рейса
export const FlightStatus = {
	Planned: "Planned", // Запланирован
	"In transit": "In transit", // В пути
	Arrived: "Arrived", // Прибыл
	Closed: "Closed", // Закрыт
} as const;

export type IFlightStatus = keyof typeof FlightStatus;

// Интерфейс рейса.
// Рейс — это логистическая отправка, объединяющая несколько мешков (багажа)
// для транспортировки между странами/складами.
export interface IFlight {
	_id?: string;

	// Человекочитаемый код рейса, например "DE-UBN-20251218express"
	code: string;

	// Страна отправления (например, "США" или "Монголия")
	fromCountry: string;

	// Страна назначения (например, "Монголия" или "Россия")
	toCountry: string;

	// Склад отправления (ссылка на Branch)
	fromBranchId?: Types.ObjectId | null;

	// Склад назначения (ссылка на Branch)
	toBranchId?: Types.ObjectId | null;

	// Планируемая дата и время отправления
	plannedDepartureAt?: Date | null;

	// Планируемая дата и время прибытия
	plannedArrivalAt?: Date | null;

	// Фактическая дата и время отправления
	actualDepartureAt?: Date | null;

	// Фактическая дата и время прибытия
	actualArrivalAt?: Date | null;

	// Статус рейса
	status: IFlightStatus;

	// Количество привязанных мешков (вычисляемое поле, можно получать через агрегацию)
	bagsCount?: number;

	// Суммарный вес всех мешков в килограммах (вычисляемое поле)
	totalWeightKg?: number;

	// Описание рейса (для администратора)
	admin_description?: string | null;

	createdAt?: Date;
	updatedAt?: Date;
}

// Для Mongo-документа исключаем только технические поля
export interface IFlightDocument extends Omit<IFlight, "_id">, Document {}

const flightSchema = new Schema<IFlightDocument>(
	{
		// Код рейса (обязательное поле, уникальное)
		code: { type: String, required: true, unique: true, index: true },

		// Страна отправления
		fromCountry: { type: String, required: true },

		// Страна назначения
		toCountry: { type: String, required: true },

		// Склад отправления (ссылка на Branch)
		fromBranchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },

		// Склад назначения (ссылка на Branch)
		toBranchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },

		// Планируемые даты
		plannedDepartureAt: { type: Date, default: null },
		plannedArrivalAt: { type: Date, default: null },

		// Фактические даты
		actualDepartureAt: { type: Date, default: null },
		actualArrivalAt: { type: Date, default: null },

		// Статус рейса (по умолчанию "Planned" - запланирован)
		status: {
			type: String,
			enum: ["Planned", "In transit", "Arrived", "Closed"],
			default: "Planned",
		},

		// Описание для администратора
		admin_description: { type: String, default: null },

		createdAt: { type: Date, default: Date.now },
	},
	{
		versionKey: false,
		timestamps: true, // Автоматически добавляет createdAt и updatedAt
	}
);

// Экспортируем модель Flight
export const FlightModel: Model<IFlightDocument> = models?.Flight || model<IFlightDocument>("Flight", flightSchema);
