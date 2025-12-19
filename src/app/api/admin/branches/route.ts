import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { BranchModel } from "@/mongodb/models/branchModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";

// API endpoint для получения списка складов.
// Этот endpoint доступен только для администраторов.
export async function GET() {
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

		// 4. Получаем все склады.
		const branchesDocs = await BranchModel.find().sort({ title: 1 }).lean();

		// 5. Преобразуем данные в удобный формат.
		const branches = normalizeDbRes(branchesDocs);

		// 6. Возвращаем список складов в формате JSON.
		return NextResponse.json({
			branches,
			total: branches.length,
		});
	} catch (error) {
		console.error("branches list error", error);
		return NextResponse.json({ message: "Ошибка получения списка складов" }, { status: 500 });
	}
}
