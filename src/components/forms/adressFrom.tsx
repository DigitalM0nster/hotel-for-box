"use client";

import { Input } from "../ui/FormElements/Input";
import PhoneControled from "../ui/FormElements/Phone";

import Select from "../ui/FormElements/Select";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { adressSchema, AdressSchemaFormData } from "@/helpers/zod/validateZod";
import { IAdress } from "@/mongodb/models/adressModel";

import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { redirect } from "next/navigation";

import { createAdress, updateAdress } from "@/libs/services/adressService";
import { progectPathes } from "@/config/pathes";

export default function AdressFrom({ adress, userId }: { adress: IAdress | null; userId: string }) {
    const isCreatingStat = !!!adress;

    const createDefaultValues = (adress: IAdress | null, isCreating: boolean) => {
        return {
            ...(!isCreating
                ? !adress?.isBusiness
                    ? {
                          ...adress,
                          recipientBirthDate: new Date(adress?.recipientBirthDate! || "")
                              .toISOString()
                              .split("T")[0],
                          passportIssuedDate: new Date(adress?.passportIssuedDate || "")
                              .toISOString()
                              .split("T")[0],
                      }
                    : adress
                : {
                      isBusiness: false,
                  }),
        };
    };

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid, isSubmitting, isDirty },
        watch,
    } = useForm<AdressSchemaFormData>({
        mode: "onChange",
        resolver: zodResolver(adressSchema),
        defaultValues: createDefaultValues(adress, isCreatingStat),
    });

    const handleAction = async (formData: AdressSchemaFormData) => {
        const res = toastShowResult(
            isCreatingStat
                ? await createAdress({ ...formData, userId })
                : await updateAdress({ ...formData, _id: adress._id })
        );
        if (res.type === "success") {
            redirect(progectPathes.address_book.path);
        }
    };

    const isBusiness = watch("isBusiness");

    return (
        <form
            className=" flex flex-col gap-4 py-6 w-full
                    lg:w-202
                    xl:gap-6 xl:w-219
                    "
            onSubmit={handleSubmit(handleAction)}
        >
            <div className="h2 text-f-blue-950 mb-6">
                {!adress ? "Создание новго адреса" : "Обновление адреса"}
            </div>
            <Input
                {...register("isBusiness")}
                type="toggle"
                title="Для бизнеса"
                disabled={!isCreatingStat}
            />

            <Controller
                name="country"
                control={control}
                render={({ field, fieldState }) => (
                    <Input
                        {...field}
                        error={fieldState.error?.message}
                        title="Страна"
                        type="adress"
                        adressType="country"
                    />
                )}
            />
            <Controller
                name="city"
                control={control}
                render={({ field, fieldState }) => (
                    <Input
                        {...field}
                        error={fieldState.error?.message}
                        title="Город"
                        type="adress"
                        adressType="locality"
                    />
                )}
            />
            <Controller
                name="adress"
                control={control}
                render={({ field, fieldState }) => (
                    <Input
                        {...field}
                        error={fieldState.error?.message}
                        title="Адрес"
                        type="adress"
                        adressType="house"
                    />
                )}
            />

            {/* <Input {...register("adress")} error={errors.adress?.message} title="Адрес" /> */}
            <Select
                {...register("deliveryMethod")}
                disabledOption="Выберете тип доставки"
                defaultValue={adress ? adress.deliveryMethod : ""}
                options={[
                    { value: "warehouse", title: "до  Склада" },
                    { value: "courier", title: "до  Двери курьером" },
                ]}
                title="Тип доставки"
            />

            {isBusiness ? (
                <>
                    <Input
                        {...register("companyName")}
                        title="Название компании"
                        error={(errors as any)?.companyName?.message || undefined}
                        required
                        min={2}
                        max={15}
                    />
                </>
            ) : (
                <>
                    <Input
                        {...register("recipientName")}
                        title="Имя получателя"
                        error={(errors as any)?.recipientName?.message || undefined}
                    />
                    <Input
                        {...register("recipientSurname")}
                        title="Фамилия получателя"
                        error={(errors as any)?.recipientSurname?.message || undefined}
                    />
                    <Input
                        {...register("recipientPatronymic")}
                        title="Отчество получателя"
                        error={(errors as any)?.recipientPatronymic?.message || undefined}
                    />
                    <Input
                        {...register("recipientBirthDate")}
                        type="date"
                        title="Дата рождения получателя"
                        error={(errors as any)?.recipientBirthDate?.message || undefined}
                    />

                    <Input
                        {...register("recipientInnNumber")}
                        title="ИНН/ИИН/УНП получателя"
                        error={(errors as any)?.recipientInnNumber?.message || undefined}
                    />

                    <Input
                        {...register("passportSeriesNumber")}
                        title="Паспорт получателя: Серия номер"
                        error={(errors as any)?.passportSeriesNumber?.message || undefined}
                    />
                    <Input
                        {...register("passportIssuedBy")}
                        title="Кем выдан паспорт"
                        error={(errors as any)?.passportIssuedBy?.message || undefined}
                    />
                    <Input
                        {...register("passportIssuedDate")}
                        type="date"
                        title="Дата выдачи паспорта"
                        error={(errors as any)?.passportIssuedDate?.message || undefined}
                    />

                    <Input
                        {...register("recipientEmail")}
                        type="email"
                        title="Email получателя"
                        error={(errors as any)?.recipientEmail?.message || undefined}
                    />
                </>
            )}

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
                        title="Дополнительный телефон"
                        error={errors.phone2?.message}
                        placeholder={"Введите номер"}
                    />
                )}
            />

            <button
                type="submit"
                disabled={!(isDirty && isValid && !isSubmitting)}
                className="button-1 btn   text-f-white-100 bg-f-accent
                                disabled:bg-f-blue-disabled disabled:cursor-not-allowed
                                "
            >
                {isCreatingStat ? "Сохранить" : "Обновить"}
            </button>
        </form>
    );
}
