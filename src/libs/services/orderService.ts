"use server";

import { auth } from "@/auth";
import { Product } from "@/components/forms/productForm";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { connectDB } from "@/mongodb/connect";
import { IAdress } from "@/mongodb/models/adressModel";
import { IOrder, IOrderStatus, OrderModel, StatusEnToRu } from "@/mongodb/models/orderModel";
import { IProduct, ProductModel } from "@/mongodb/models/productModel";
import { IUser } from "@/mongodb/models/userModel";
import { IActionResult } from "@/types/types";
import { redirect } from "next/navigation";

interface CreateProps {
    shopUrl: string;
    track: string;
    products_total_cost: number;
    userId: string;
    adressId: string;
    description: string;
    products: Product[];
}

export async function createOrder(props: CreateProps): Promise<boolean> {
    const { products, ...orderProps } = props;
    console.log("CREATE", props);
    try {
        await connectDB();
        const order = new OrderModel();
        Object.assign(order, orderProps);
        await order.save();

        await Promise.all(
            products.map(async (product) => {
                const prod = new ProductModel();
                Object.assign(prod, { ...product, orderId: order._id });
                await prod.save();
            })
        );
        console.log("CREATED ✅", order._id);
        return true;
    } catch (error) {
        console.log("Error 📛", error);
        return false;
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
        const order = await OrderModel.findById(id)
            .populate<{ adress: IUser }>("user")
            .populate<{ adress: IAdress }>("adress")
            .populate<{ products: IProduct[] }>("products")
            .lean<IOrder>();
        if (order) return normalizeDbRes<IOrder>(order);
        return null;
    } catch (error) {
        console.log("❌ERROR❌", error);
        return null;
    }
}

export async function changeOrderStatus(id: string, status: string): Promise<IActionResult> {
    try {
        await connectDB();
        const order = await OrderModel.findByIdAndUpdate(id, { status });
        return {
            type: "success",
            message: `Статус изменен на  "${status}"-"${StatusEnToRu[status]}"`,
        };
    } catch (error) {
        return { type: "error", message: "Ошибка обновления стастуса" };
    }
}
