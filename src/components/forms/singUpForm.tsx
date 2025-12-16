"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import "react-phone-input-2/lib/style.css";
import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/FormElements/Input";
import { RegisterFormData, registerSchema } from "@/helpers/zod/validateZod";
import PhoneControled from "../ui/FormElements/Phone";
import { registerUser } from "@/libs/services/usersService";

export default function RegisterForm() {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
    });

    const handleAction = async (formData: RegisterFormData) => {
        const res = toastShowResult(await registerUser(formData));
        if (res.type === "success") {
            redirect("/login");
        }
    };

    return (
        <form
            onSubmit={handleSubmit(handleAction)}
            className=" flex flex-col gap-4 
                    xl:gap-6
                    "
        >
            <Input {...register("name")} placeholder="Имя" error={errors?.name?.message} />
            <Input
                {...register("email")}
                placeholder="Email"
                type="email"
                error={errors?.email?.message}
            />
            <Controller
                name="phone1"
                control={control}
                render={({ field }) => (
                    <PhoneControled
                        {...field}
                        error={errors.phone1?.message}
                        placeholder={"Введите номер"}
                    />
                )}
            />

            <Input
                {...register("password")}
                placeholder="Пароль"
                error={errors.password?.message}
                hideEye
                min={8}
            />
            <Input
                {...register("confirmPassword")}
                placeholder="Подтверждение пароля"
                error={errors.confirmPassword?.message}
                hideEye
                min={8}
            />

            <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="button-1 py-[11px] px-[70px] text-f-white-100 bg-f-accent self-start  rounded-full cursor-pointer
                            disabled:bg-f-blue-disabled disabled:cursor-not-allowed
                            "
            >
                Зарегистрироваться
            </button>
        </form>
    );
}
