import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { UserModel } from "@/mongodb/models/userModel";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IUser } from "@/mongodb/models/userModel";

// API endpoint для получения списка заблокированных пользователей.
// Этот endpoint доступен только для администраторов.
// Возвращает всех пользователей, у которых is_blocked === true.
export async function GET(request: Request) {
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

		// 4. Получаем параметры фильтрации по датам из URL.
		const { searchParams } = new URL(request.url);
		const dateFrom = searchParams.get("dateFrom");
		const dateTo = searchParams.get("dateTo");

		// 5. Строим фильтр для заблокированных пользователей.
		const filter: Record<string, unknown> = { is_blocked: true };

		// Фильтр по дате блокировки (updatedAt)
		if (dateFrom || dateTo) {
			const dateFilter: Record<string, Date> = {};
			if (dateFrom) {
				const fromDate = new Date(dateFrom);
				fromDate.setHours(0, 0, 0, 0);
				dateFilter.$gte = fromDate;
			}
			if (dateTo) {
				const toDate = new Date(dateTo);
				toDate.setHours(23, 59, 59, 999);
				dateFilter.$lte = toDate;
			}
			filter.updatedAt = dateFilter;
		}

		// 6. Находим всех пользователей, у которых is_blocked === true.
		//    Сортируем по дате обновления (updatedAt), чтобы самые недавно заблокированные были первыми.
		const blockedUsers = await UserModel.find(filter).sort({ updatedAt: -1 }).lean();

		// 7. Преобразуем данные в удобный формат.
		const users = normalizeDbRes<IUser[]>(blockedUsers);

		// 8. Возвращаем список заблокированных пользователей в формате JSON.
		return NextResponse.json({
			users,
			total: users.length,
		});
	} catch (error) {
		console.error("blocked users report error", error);
		return NextResponse.json({ message: "Ошибка получения заблокированных пользователей" }, { status: 500 });
	}
}
