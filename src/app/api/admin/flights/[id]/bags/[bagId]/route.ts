import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { BagModel } from "@/mongodb/models/bagModel";
import { Types } from "mongoose";

// API endpoint для отвязки сумки от рейса.
// Этот endpoint доступен только для администраторов.
export async function DELETE(request: Request, { params }: { params: { id: string; bagId: string } }) {
	try {
		// 1. Проверяем авторизацию пользователя через NextAuth.
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		// 2. Проверяем, что пользователь имеет права администратора.
		const role = session.user.role ?? "user";
		if (role !== "admin" && role !== "super") {
			return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
		}

		// 3. Подключаемся к базе данных MongoDB.
		await connectDB();

		// 4. Получаем ID сумки из параметров URL.
		const bagId = params.bagId;
		const bagObjectId = new Types.ObjectId(bagId);

		// 5. Находим сумку по ID.
		const bag = await BagModel.findById(bagObjectId);
		if (!bag) {
			return NextResponse.json({ message: "Сумка не найдена" }, { status: 404 });
		}

		// 6. Отвязываем сумку от рейса (устанавливаем flightId в null).
		bag.flightId = null;
		await bag.save();

		// 7. Возвращаем успешный ответ.
		return NextResponse.json({
			message: "Сумка успешно отвязана от рейса",
		});
	} catch (error) {
		console.error("detach bag from flight error", error);
		return NextResponse.json({ message: "Ошибка отвязки сумки от рейса" }, { status: 500 });
	}
}
