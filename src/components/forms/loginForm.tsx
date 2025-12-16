"use client";

import { Input } from "@/components/ui/FormElements/Input";
import { loginAction } from "@/libs/formActions/usersActionClient";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function LoginForm() {
    const search = useSearchParams();

    const errorMemo = useMemo(() => {
        const error = search.get("code");
        if (error == "credentials") {
            return <div className="text-f-error"> Ошибка логина или пароля</div>;
        }
        if (error == "user_blocked") {
            return <div className="text-f-error"> Ваш аккаунт заблокирован администратором</div>;
        }
        return false;
    }, [search]);

    return (
        <form
            className=" flex flex-col gap-4 
                            xl:gap-6
                            "
            action={loginAction}
        >
            {errorMemo}

            <Input name="email" type="email" placeholder="E-mail" required />

            <div className="w-full flex flex-col gap-2">
                <Input name="password" placeholder="Введите ваш пароль" required hideEye />
                <Link href={"/recover"} className="body-3 text-f-blue-950 cursor-pointer">
                    Забыли пароль?
                </Link>
            </div>

            <button
                type="submit"
                className="button-1 py-[11px] px-[70px] text-f-white-100 bg-f-accent self-start  rounded-full cursor-pointer"
            >
                Войти
            </button>
        </form>
    );
}
