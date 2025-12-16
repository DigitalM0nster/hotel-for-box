"use client";

import { signIn } from "next-auth/react";

export async function loginAction(formData: FormData) {
    //! Используем use client потому что signIn клиентская функция
    const email = formData.get("email");
    const password = formData.get("password");

    await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/user", // ← куда редиректить после успешного входа
    });
}
