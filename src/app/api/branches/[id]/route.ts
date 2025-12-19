import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { BranchModel } from "@/mongodb/models/branchModel";

type RouteParams = {
	params: {
		id: string;
	};
};

// Удаление отделения администратором.
// Это чистый API-роут: к нему обращается фронтенд через fetch.
export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		// 1. Проверяем, что пользователь авторизован и это админ/супер.
		const session = await auth();
		if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
			return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
		}

		const branchId = params.id;
		if (!branchId) {
			return NextResponse.json({ message: "Не указан ID отделения" }, { status: 400 });
		}

		// 2. Подключаемся к базе и ищем отделение.
		await connectDB();
		const branch = await BranchModel.findById(branchId);
		if (!branch) {
			return NextResponse.json({ message: "Отделение не найдено" }, { status: 404 });
		}

		// 3. Удаляем отделение.
		await BranchModel.deleteOne({ _id: branchId });

		return NextResponse.json({ message: "Отделение удалено" });
	} catch (error) {
		console.error("delete branch error", error);
		return NextResponse.json({ message: "Ошибка удаления отделения" }, { status: 500 });
	}
}
