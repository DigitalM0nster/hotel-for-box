"use server";

import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { connectDB } from "@/mongodb/connect";
import { AdressModel, IAdress } from "@/mongodb/models/adressModel";

import { IActionResult } from "@/types/types";
import { ObjectId } from "mongodb";

export const createAdress = async (adress: Omit<IAdress, "userId"> & { userId: string }): Promise<IActionResult & { adressId?: string }> => {
	try {
		await connectDB();

		//TODO check

		const newAdress = new AdressModel();

		Object.assign(newAdress, adress);

		newAdress.userId = new ObjectId(adress.userId);

		if (adress.passportIssuedDate) {
			newAdress.passportIssuedDate = new Date(adress.passportIssuedDate).toISOString(); // переводим ДАТУ для базы
		}

		if (adress.recipientBirthDate) {
			newAdress.recipientBirthDate = new Date(adress.recipientBirthDate).toISOString(); // переводим ДАТУ для базы
		}

		const savedAdress = await newAdress.save();
		const adressId = savedAdress._id ? savedAdress._id.toString() : undefined;

		return { type: "success", message: "Адрес успешно добавлен", adressId };
	} catch (error) {
		if (error instanceof Error) {
			return { type: "warning", message: error.message };
		}
		return { type: "error", message: "Ошибка операции, повторите позже." };
	}
};

export const updateAdress = async (adress: Omit<IAdress, "userId">): Promise<IActionResult> => {
	try {
		await connectDB();

		//TODO check

		const updatedAdress = await AdressModel.findOne({ _id: adress._id });

		if (!updatedAdress) return { type: "error", message: "Адрес не найден" };

		Object.assign(updatedAdress, adress);

		if (adress.passportIssuedDate) {
			updatedAdress.passportIssuedDate = new Date(adress.passportIssuedDate).toISOString(); // переводим ДАТУ для базы
		}

		if (adress.recipientBirthDate) {
			updatedAdress.recipientBirthDate = new Date(adress.recipientBirthDate).toISOString(); // переводим ДАТУ для базы
		}

		await updatedAdress.save();

		return { type: "success", message: "Адрес успешно обновлен" };
	} catch (error) {
		if (error instanceof Error) {
			return { type: "warning", message: error.message };
		}
		return { type: "error", message: "Ошибка операции, повторите позже." };
	}
};

export async function getAdressById({ id }: { id: string }): Promise<IAdress | null> {
	try {
		connectDB();
		const adress = await AdressModel.findById({ _id: id });

		return normalizeDbRes<IAdress>(adress);
	} catch (error) {
		return null;
	}
}

// Получить все адреса конкретного пользователя для админки.
export async function getAdressesByUserIdForAdmin({ userId }: { userId: string }): Promise<IAdress[]> {
	try {
		await connectDB();
		const adresses = await AdressModel.find({ userId });
		return normalizeDbRes<IAdress[]>(adresses);
	} catch (error) {
		return [];
	}
}
