import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { OrderModel } from "@/mongodb/models/orderModel";
import { NextResponse } from "next/server";

type RouteParams = {
	params: {
		id: string;
	};
};

// Удаление заказа пользователем.
// Разрешаем удалять только свои заказы и только пока статус "Created" ("Создано").
export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		const orderId = params.id;
		if (!orderId) {
			return NextResponse.json({ message: "Не указан ID заказа" }, { status: 400 });
		}

		await connectDB();

		// Находим заказ текущего пользователя.
		// Поддерживаем и технический _id, и человекочитаемый orderId.
		const order = await OrderModel.findOne({
			userId: session.user.id,
			$or: [{ _id: orderId }, { orderId }],
		});
		if (!order) {
			return NextResponse.json({ message: "Заказ не найден" }, { status: 404 });
		}

		// Блокируем удаление, если заказ уже вышел из черновика (любой статус, кроме "Created")
		if (order.status !== "Created") {
			return NextResponse.json({ message: "Удалять можно только заказы в статусе «Создано»" }, { status: 400 });
		}

		// Просто удаляем заказ: товары теперь хранятся внутри самого заказа.
		await OrderModel.deleteOne({ _id: order._id });

		return NextResponse.json({ message: "Заказ удалён" });
	} catch (error) {
		console.error("delete order error", error);
		return NextResponse.json({ message: "Ошибка удаления заказа" }, { status: 500 });
	}
}
