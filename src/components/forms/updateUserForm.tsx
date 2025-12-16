"use client";

import Link from "next/link";
import { Input } from "../ui/FormElements/Input";
import Select from "../ui/FormElements/Select";
import { Controller, useForm } from "react-hook-form";
import PhoneControled from "../ui/FormElements/Phone";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserFormData, updateUserSchema } from "@/helpers/zod/validateZod";
// import "react-phone-input-2/lib/style.css";
import { IUser } from "@/mongodb/models/userModel";
import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { useEffect } from "react";
import { updateUser } from "@/libs/services/usersService";
export default function UpdateUserForm({ user }: { user: IUser }) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isValid, isSubmitting, isDirty },
    } = useForm<UpdateUserFormData>({
        resolver: zodResolver(updateUserSchema),
        mode: "onChange",
        defaultValues: {
            ...user,
            bithday: user.birthday
                ? new Date(user.birthday).toISOString().split("T")[0] //формируем дату для инпута
                : undefined,
        },
    });
    const handleAction = async (formData: UpdateUserFormData) => {
        toastShowResult(await updateUser({ ...formData, fullData: true, id: user._id! }));
        reset(formData);
    };

    return (
        <form onSubmit={handleSubmit(handleAction)} className="flex flex-col gap-4 lg:gap-6">
            <div className=" grid grid-cols-1 md:grid-cols-2  gap-4 lg:gap-6">
                <div className="flex flex-col gap-4 lg:gap-6">
                    <Input
                        {...register("name")}
                        title="Имя"
                        required
                        error={errors.name?.message}
                    />
                    <Input
                        {...register("surname")}
                        title="Фамилия"
                        required
                        error={errors.surname?.message}
                    />
                    <Input
                        {...register("patronymic")}
                        title="Отчество"
                        required
                        error={errors.patronymic?.message}
                    />

                    <Input
                        {...register("bithday")}
                        type="date"
                        title="День рождения"
                        required
                        error={errors.bithday?.message}
                    />

                    <Input
                        title="Email Address (не редактируется)"
                        defaultValue={user.email}
                        name="email"
                        type="email"
                        disabled
                    />

                    <Select
                        {...register("gender")}
                        required
                        title="Пол"
                        name="gender"
                        options={[
                            { title: "Мужской", value: "male" },
                            { title: "Женский", value: "female" },
                        ]}
                        disabledOption="Выберите пол"
                    />
                </div>
                <div className="flex flex-col gap-4 lg:gap-6">
                    <Controller
                        name="phone1"
                        control={control}
                        render={({ field }) => (
                            <PhoneControled
                                {...field}
                                title="Основной телефон"
                                error={errors.phone1?.message}
                                placeholder={"Введите номер"}
                            />
                        )}
                    />
                    <Controller
                        name="phone2"
                        control={control}
                        render={({ field }) => (
                            <PhoneControled
                                {...field}
                                value={user.phone2 || ""}
                                title="Дополнительный телефон"
                                error={errors.phone2?.message}
                                placeholder={"Введите номер"}
                            />
                        )}
                    />
                    <Input
                        {...register("city")}
                        title="Город"
                        error={errors.city?.message}
                        min={2}
                        max={15}
                        required
                    />
                    <Input
                        {...register("adress")}
                        title="Адресс"
                        error={errors.adress?.message}
                        min={2}
                        max={15}
                        required
                    />
                    <Input
                        {...register("zip_code_eng")}
                        title="Zip-Code (ENG)"
                        error={errors.zip_code_eng?.message}
                        required
                    />
                </div>
            </div>

            <Input {...register("notifications")} type="checkbox" title="Получать уведомления" />

            <div
                className="flex flex-row gap-4
                       
                        "
            >
                <Link
                    href={"change_password"}
                    className="button-1 border-1 border-f-accent p-[11px] px-6 rounded-full text-center cursor-pointer text-f-accent"
                >
                    Поменять пароль
                </Link>

                <button
                    type="submit"
                    disabled={!(isDirty && isValid && !isSubmitting)}
                    className="button-1  p-[11px] px-6 rounded-full text-center cursor-pointer text-f-white-100 bg-f-accent
                                disabled:bg-f-blue-disabled disabled:cursor-not-allowed
                                "
                >
                    Сохранить
                </button>
            </div>
        </form>
    );
}
