"use server";

import { auth } from "@/auth";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { UpdateUserFormData } from "@/helpers/zod/validateZod";
import { connectDB } from "@/mongodb/connect";
import { AdressModel, IAdress } from "@/mongodb/models/adressModel";
import { IUser, UserModel } from "@/mongodb/models/userModel";
import { IActionResult } from "@/types/types";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import Stripe from "stripe";

//! РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
type IUserCreateProps = OnlyRequired<IUser>;
export const registerUser = async (user: IUserCreateProps): Promise<IActionResult> => {
    try {
        await connectDB();

        //check
        if (await UserModel.findOne({ phone1: user.phone1 }))
            throw new Error("Указанный телефон уже используется другим пользователем.");

        if (await UserModel.findOne({ email: user.email }))
            throw new Error("Указанный email уже используется другим пользователем.");

        //create user
        const newUser = new UserModel();
        Object.assign(newUser, user);

        //TODO Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const costomer = await stripe.customers.create({
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone1,
        });
        newUser.stripeCustomerId = costomer.id;

        //hash pass
        const hashedPassword = await bcrypt.hash(user.password, 10);
        newUser.password = hashedPassword;

        await newUser.save();
        return { type: "success", message: "Вы успешно зарегестрированы." };
    } catch (error) {
        console.log("ERROR 👎", error);
        if (error instanceof Error) {
            return { type: "warning", message: error.message };
        }
        return { type: "error", message: "Ошибка операции, повторите позже." };
    }
};

//! ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
type IUserUpdateProps = UpdateUserFormData & { id: string; fullData: boolean };
export const updateUser = async (user: IUserUpdateProps): Promise<IActionResult> => {
    const { id, ...updateFields } = user;
    try {
        await connectDB();

        const currentUser = await UserModel.findById(id);

        //check
        if (!currentUser) throw new Error("Пользователь не найден");

        if (await UserModel.findOne({ phone1: user.phone1, _id: { $ne: currentUser._id } }))
            throw new Error("Указанный телефон уже используется другим пользователем.");

        Object.assign(currentUser, updateFields);

        currentUser.birthday = new Date(user.bithday).toISOString(); // переводим ДАТУ для базы

        await currentUser.save();
        return { type: "success", message: "Ваши данные успешно обновлены" };
    } catch (error) {
        if (error instanceof Error) {
            return { type: "warning", message: error.message };
        }
        return { type: "error", message: "Ошибка операции, повторите позже." };
    }
};

//! Пользователь со всеми адресами
export const getUserWithAdresses = async () => {
    try {
        const session = await auth();
        if (!session) throw new Error("Требуется авторизация");
        await connectDB();
        const user = await UserModel.findById(session.user.id)
            .populate<{ addresses: IAdress[] }>("adresses")
            .lean<IUser>();

        if (!user || user.is_blocked) throw new Error("Требуется авторизация");
        return normalizeDbRes<IUser>(user);
    } catch (error) {
        redirect("/login");
    }
};

export const getCurrentUser = async () => {
    try {
        const session = await auth();
        if (!session) throw new Error("Требуется авторизация");

        await connectDB();
        const currentUser = await UserModel.findById(session.user.id);
        if (!currentUser || currentUser.is_blocked) throw new Error("Требуется авторизация");

        return normalizeDbRes<IUser>(currentUser);
    } catch (error) {
        redirect("/login");
    }
};
