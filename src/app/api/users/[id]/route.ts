import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { UserModel } from "@/mongodb/models/userModel";
import { OrderModel } from "@/mongodb/models/orderModel";

type RouteParams = {
	params: {
		id: string;
	};
};

// Удаление пользователя администратором.
// Это чистый API-роут: к нему обращается фронтенд через fetch.
export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		// 1. Проверяем, что пользователь авторизован и это админ/супер.
		const session = await auth();
		if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
			return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
		}

		const userId = params.id;
		if (!userId) {
			return NextResponse.json({ message: "Не указан ID пользователя" }, { status: 400 });
		}

		// Дополнительная защита: не позволяем администратору удалить сам себя.
		if (session.user.id === userId) {
			return NextResponse.json({ message: "Нельзя удалить пользователя, под которым вы сейчас авторизованы" }, { status: 400 });
		}

		// 2. Подключаемся к базе и ищем пользователя.
		await connectDB();

		// Ищем пользователя по ID.
		// ВАЖНО: теперь у нас есть два типа ID:
		// - внутренний Mongo ObjectId (24 шестнадцатеричных символа);
		// - человекочитаемый publicId в формате UXXXXXXXXXX.
		//
		// Если строка ПРАВДОПОДОБНА как ObjectId — ищем и по _id, и по publicId.
		// Если это явно не ObjectId (например, "U1234567890") — ищем только по publicId,
		// чтобы не словить CastError от Mongoose при попытке привести "U..." к ObjectId.
		const isLikelyObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
		const query = isLikelyObjectId ? { $or: [{ _id: userId }, { publicId: userId }] } : { publicId: userId };

		const user = await UserModel.findOne(query);
		if (!user) {
			return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 });
		}

		// 3. Проверяем дополнительные правила безопасности по ролям.
		// Нельзя удалять суперадминистратора вообще (никому).
		if (user.role === "super") {
			return NextResponse.json({ message: "Нельзя удалить суперадминистратора" }, { status: 400 });
		}

		// Администратор не может удалить другого администратора.
		if (session.user.role === "admin" && user.role === "admin") {
			return NextResponse.json({ message: "Администратор не может удалить другого администратора" }, { status: 400 });
		}

		// 4. Если у пользователя есть заказы, сохраняем снимок пользователя во все его заказы.
		// Это нужно, чтобы после удаления пользователя информация о нём сохранилась в заказах.
		const orders = await OrderModel.find({ userId: user._id });
		if (orders.length > 0) {
			// Создаём снимок пользователя для сохранения в заказах.
			const userSnapshot = {
				publicId: user.publicId ?? null,
				name: user.name,
				surname: user.surname ?? null,
				patronymic: user.patronymic ?? null,
				email: user.email,
				phone1: user.phone1,
				phone2: user.phone2 ?? null,
				city: user.city ?? null,
				isDeleted: true, // Помечаем, что пользователь был удалён
			};

			// Обновляем все заказы этого пользователя, сохраняя снимок.
			await OrderModel.updateMany({ userId: user._id }, { $set: { userSnapshot } });

			console.log(`✅ Сохранён снимок пользователя в ${orders.length} заказ(ов)`);
		}

		// 5. Удаляем пользователя по его внутреннему ObjectId.
		// Теперь все его заказы имеют снимок пользователя, поэтому удаление безопасно.
		await UserModel.deleteOne({ _id: user._id });

		return NextResponse.json({
			message: orders.length > 0 ? `Пользователь удалён. Снимок пользователя сохранён в ${orders.length} заказ(ах).` : "Пользователь удалён",
		});
	} catch (error) {
		console.error("delete user error", error);
		return NextResponse.json({ message: "Ошибка удаления пользователя" }, { status: 500 });
	}
}
