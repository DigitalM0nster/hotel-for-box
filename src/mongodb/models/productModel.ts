import { Model, model, models, Schema, Types } from "mongoose";

export interface IProduct {
    _id?: string;
    orderId: string;
    name: string; // Название
    brand: string; // Брэнд
    category: string; // Категория
    size: string; //XL
    color: string; // Цвет
    price: number; // Цена
    quantity: number; // Количество
    weight: number; //Вес
    width_x: number; // Ширина
    height_y: number; //Высота
    depth_z: number; // Глубина
    description: string; // Описание

    status: "created" | "received" | "approved" | "paid" | "departed" | "arrived" | "delivered";

    createdAt?: Date;
}

export interface IProductDocument extends Omit<IProduct, "_id" | "orderId">, Document {
    orderId: Types.ObjectId;
}

const productSchema = new Schema<IProductDocument>(
    {
        orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
        name: { type: String, required: true },
        brand: { type: String, required: true },
        category: { type: String, default: null },
        size: { type: String, default: null },
        color: { type: String, default: null },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        weight: { type: Number, required: true },
        width_x: { type: Number, required: true },
        height_y: { type: Number, required: true },
        depth_z: { type: Number, required: true },
        description: { type: String, required: false },

        status: {
            type: String,
            enum: ["created", "received", "approved", "paid", "departed", "arrived", "delivered"],
            default: "created",
        },

        createdAt: { type: Date, default: Date.now },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

export const ProductModel =
    (models?.Product as Model<IProductDocument>) ||
    model<IProductDocument>("Product", productSchema);
