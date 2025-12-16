import { model, Model, models, Schema, Types } from "mongoose";
import { IProduct, ProductModel } from "./productModel";
import { IAdress } from "./adressModel";
import { IUser } from "./userModel";
ProductModel;

export const StatusEnToRu = {
    Created: "Создано",
    Received: "Получено",
    "Shipping approved": "Отправка одобрена",
    "Shipping paid": "Оплата доставки произведена",
    Departed: "Отправлено",
    Arrived: "Прибыло",
    Delivered: "Доставлено",
} as const;

export type IOrderStatus = keyof typeof StatusEnToRu;

export interface IOrder {
    _id?: string;

    userId: Types.ObjectId; // ID  отправитель
    adressId: Types.ObjectId; // ID адресс

    track: string;
    shopUrl: string;
    products_total_cost: number; //Общая стоимость товаров

    description: string; // Описание

    order_coast: number; // Стоимость посылки
    paid: number;

    //Размеры общей  посылки - админ вносит
    width_x: number; // Ширина
    height_y: number; //Высота
    depth_z: number; // Глубина
    //Вес
    weight: number;
    //Admin
    admin_description: string;
    h4b_us_id: string;

    status: IOrderStatus;

    createdAt?: Date;
    //! Виртуальные поля
    user: IUser;
    adress: IAdress; //Куда доставка
    products: IProduct[]; // Товары
}

export interface IOrderDocument
    extends Omit<IOrder, "_id" | "user" | "adress" | "products">,
        Document {}
const orderSchema = new Schema<IOrderDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        adressId: { type: Schema.Types.ObjectId, ref: "Adress", required: true },

        track: { type: String, required: true },
        shopUrl: { type: String, required: true },

        description: { type: String, required: true },
        h4b_us_id: { type: String, default: null },
        admin_description: { type: String, default: null },
        products_total_cost: { type: Number, required: true },
        order_coast: { type: Number, default: null },
        paid: { type: Number, default: null },
        weight: { type: Number, default: null },
        width_x: { type: Number, default: null },
        height_y: { type: Number, default: null },
        depth_z: { type: Number, default: null },
        status: {
            type: String,
            enum: [
                "Created",
                "Received",
                "Shipping approved",
                "Shipping paid",
                "Departed",
                "Arrived",
                "Delivered",
            ],
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

orderSchema.virtual("adress", {
    ref: "Adress",
    localField: "adressId",
    foreignField: "_id",
    justOne: true,
});

orderSchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "orderId",
    justOne: false,
});

// ✅ Включаем виртуальные поля в JSON и Object
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export const OrderModel =
    (models?.Order as Model<IOrderDocument>) || model<IOrderDocument>("Order", orderSchema);
