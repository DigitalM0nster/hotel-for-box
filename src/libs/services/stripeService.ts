"use server";

import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { UserModel } from "@/mongodb/models/userModel";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function addCardToUser(
    paymentMethodId: string
): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const sessionUser = await auth();
    if (!sessionUser) return { success: false, message: "Пользователь не авторизирован" };
    const user = await UserModel.findById(sessionUser.user.id);

    if (!user || !user.stripeCustomerId) {
        return { success: false, message: "Пользователь не найден или не имеет stripeCustomerId" };
    }

    // 👉 Привязываем карту к Customer
    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
    });

    // ✅ Сохраняем карту в MongoDB (если еще не сохранена)
    user.savedCard = paymentMethodId;
    await user.save();

    return { success: true, message: "Карта успешно добавлена" };
}

export async function getSavedCard(): Promise<Stripe.Response<Stripe.PaymentMethod> | null> {
    try {
        await connectDB();
        const session = await auth();
        if (!session) return redirect("/login");

        const user = await UserModel.findById(session.user.id);

        if (!user?.savedCard) return null;

        const cardDetails = await stripe.paymentMethods.retrieve(user.savedCard);
        return cardDetails;
    } catch (error) {
        console.log("ERROR 👎", error);
        return null;
    }
}

export async function deleteCard(paymentMethodId: string) {
    try {
        await connectDB();
        const session = await auth();
        if (!session) return redirect("/login");

        const user = await UserModel.findById(session.user.id);
        if (!user) return redirect("/login");

        await stripe.paymentMethods.detach(paymentMethodId);
        user.savedCard = "";

        await user.save();
        return true;
    } catch (error) {
        console.log("ERROR 👎", error);
        return false;
    }
}
