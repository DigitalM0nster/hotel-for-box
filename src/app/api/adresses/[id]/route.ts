import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { AdressModel } from "@/mongodb/models/adressModel";
import { NextResponse } from "next/server";

type RouteParams = {
	params: {
		id: string;
	};
};

// Удаление адреса из адресной книги.
// Обычный пользователь может удалять только свои адреса (по userId).
// Суперадминистратор может удалить любой адрес по ID — это нужно для админки.
export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ message: "Требуется авторизация" }, { status: 401 });
		}

		const adressId = params.id;
		if (!adressId) {
			return NextResponse.json({ message: "Не указан ID адреса" }, { status: 400 });
		}

		await connectDB();

		// Если суперадминистратор — даём расширенные права:
		// он может удалить любой адрес по ID, независимо от userId.
		if (session.user.role === "super") {
			const adressForSuper = await AdressModel.findById(adressId);
			if (!adressForSuper) {
				return NextResponse.json({ message: "Адрес не найден" }, { status: 404 });
			}

			await adressForSuper.deleteOne();
			return NextResponse.json({ message: "Адрес удалён (через суперадмина)" });
		}

		// Обычный пользователь: удаляем только свой адрес (по userId из сессии).
		const adress = await AdressModel.findOne({ _id: adressId, userId: session.user.id });
		if (!adress) {
			return NextResponse.json({ message: "Адрес не найден" }, { status: 404 });
		}

		await adress.deleteOne();

		return NextResponse.json({ message: "Адрес удалён" });
	} catch (error) {
		console.error("delete adress error", error);
		return NextResponse.json({ message: "Ошибка удаления адреса" }, { status: 500 });
	}
}
