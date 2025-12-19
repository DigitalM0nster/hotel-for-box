import { model, models, Schema, Model, Document, Types } from "mongoose";
import { IAdress, AdressModel } from "./adressModel";
import { IOrder } from "./orderModel";
AdressModel; //! Просто подгружаем что бы  populate  его находил

export type IUserRole = "user" | "admin" | "super";

export interface IUser {
	_id?: string;
	// Человекочитаемый ID для админки и внешних ссылок, например U0000ABCD.
	publicId?: string;
	name: string;
	surname?: string;
	patronymic?: string;
	gender?: "male" | "female";
	password: string;
	role?: IUserRole;
	birthday?: string;
	phone1: string;
	phone2?: string;
	email: string;
	adress?: string;
	city?: string;
	zip_code?: string;
	notifications?: boolean;
	balance?: number;
	bonus?: number;
	level?: number;
	stripeCustomerId?: string;
	savedCard?: string;

	fullData?: boolean; // полностью заполненные данные
	isVerifiedByAdmin?: boolean; // подтверждён администратором
	is_blocked?: boolean; //блокировка
	admin_description?: string; // пометки пдмина

	adresses?: IAdress[]; // Виртуальное поле (Получатели)
	orders?: IOrder[]; // Виртуальное поле (Заказы)

	createdAt?: Date;
}

export interface IUserDocument extends Omit<IUser, "_id" | "adresses" | "orders">, Document {}

const userSchema = new Schema<IUserDocument>(
	{
		name: { type: String, required: true },
		// Короткий человекочитаемый ID пользователя.
		publicId: { type: String, unique: true, sparse: true, index: true },
		surname: { type: String, default: null },
		patronymic: { type: String, default: null },
		gender: { type: String, enum: ["male", "female"], default: null },
		password: { type: String, required: true },
		role: { type: String, enum: ["user", "admin", "super"], default: "user" },
		birthday: { type: Date, default: null },
		phone1: { type: String, required: true },
		phone2: { type: String, default: null },
		email: { type: String, required: [true, "Email обязательное поле"] },
		adress: { type: String, default: null },
		city: { type: String, default: null },
		zip_code: { type: String, default: null },
		notifications: { type: Boolean, default: true },
		balance: { type: Number, default: 0 },
		bonus: { type: Number, default: 0 },
		level: { type: Number, default: 0 },
		stripeCustomerId: { type: String, default: null },
		savedCard: { type: String, default: null },

		fullData: { type: Boolean, default: false },
		isVerifiedByAdmin: { type: Boolean, default: false },
		is_blocked: { type: Boolean, default: false },
		admin_description: { type: String, default: null },

		createdAt: { type: Date, default: Date.now },
	},
	{
		versionKey: false,
		timestamps: true,
	}
);

// ✅ Виртуальное поле addresses с адресами на которые возможно отправка
userSchema.virtual("adresses", {
	ref: "Adress", // имя модели Address
	//! это оно найдет все доки у которых в "userId" текущий "_id"
	localField: "_id", // поле в User
	foreignField: "userId", // поле в Address
});
userSchema.virtual("orders", {
	ref: "Order", // имя модели Address
	localField: "_id", // поле в User
	foreignField: "userId", // поле в Address
});

// ✅ Включаем виртуальные поля в JSON и Object
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const UserModel: Model<IUserDocument> = (models?.User as Model<IUserDocument>) || model<IUserDocument>("User", userSchema);
