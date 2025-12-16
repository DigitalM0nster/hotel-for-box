"use server";

import { auth } from "@/auth";
import { connectDB } from "@/mongodb/connect";
import { IUser, UserModel } from "@/mongodb/models/userModel";
import { redirect } from "next/navigation";
import { normalizeDbRes } from "./forDbFuncs";

export async function GetUserFromCurrentSession() {
    const session = await auth();
    if (!session) redirect("/login");
    const { user } = session;

    await connectDB();

    const userFull = await UserModel.findOne({ _id: user.id });

    if (!userFull) redirect("/login");

    const userObj = normalizeDbRes<IUser>(userFull);

    return { user: userObj };
}
