import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		const { orderIds } = await request.json();
		if (!Array.isArray(orderIds) || orderIds.length < 1) {
			return NextResponse.json({ message: "Нужно выбрать хотя бы один заказ" }, { status: 400 });
		}

		await connectDB();

		// Для админов не проверяем userId - они могут разделять любые заказы
		// Для обычных пользователей проверяем, что заказы принадлежат им
		const filter: any = { _id: { $in: orderIds } };
		if (session.user.role !== "admin" && session.user.role !== "super") {
			filter.userId = session.user.id;
		}

		const result = await OrderModel.updateMany(filter, { $set: { groupId: null } });

		if (result.modifiedCount === 0) {
			return NextResponse.json({ message: "Заказы не найдены или уже разделены" }, { status: 404 });
		}

		return NextResponse.json({ message: "Заказы разделены" });
	} catch (error) {
		console.error("split orders error", error);
		return NextResponse.json({ message: "Ошибка разделения заказов" }, { status: 500 });
	}
}
