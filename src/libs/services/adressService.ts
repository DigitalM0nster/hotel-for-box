"use server";

import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { connectDB } from "@/mongodb/connect";
import { AdressModel, IAdress } from "@/mongodb/models/adressModel";

import { IActionResult } from "@/types/types";
import { ObjectId } from "mongodb";

export const createAdress = async (
    adress: Omit<IAdress, "userId"> & { userId: string }
): Promise<IActionResult> => {
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

        await newAdress.save();

        return { type: "success", message: "Адресс успешно добавлен" };
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

        if (!updatedAdress) return { type: "error", message: "Адресс не найден" };

        Object.assign(updatedAdress, adress);

        if (adress.passportIssuedDate) {
            updatedAdress.passportIssuedDate = new Date(adress.passportIssuedDate).toISOString(); // переводим ДАТУ для базы
        }

        if (adress.recipientBirthDate) {
            updatedAdress.recipientBirthDate = new Date(adress.recipientBirthDate).toISOString(); // переводим ДАТУ для базы
        }

        await updatedAdress.save();

        return { type: "success", message: "Адресс успешно обновлен" };
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
