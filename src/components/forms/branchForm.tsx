"use client";

import { Controller, useForm } from "react-hook-form";
import { Input } from "../ui/FormElements/Input";
import { BranchFormData, branchSchema } from "@/helpers/zod/validateZod";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneControled from "../ui/FormElements/Phone";
import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { createBranch, updateBranch } from "@/libs/services/branchService";
import { progectPathes } from "@/config/pathes";
import { redirect } from "next/navigation";
import { IBranch } from "@/mongodb/models/branchModel";

export default function BranchForm({ branch }: { branch: IBranch | null }) {
    const isCreatingBranch = !!!branch;
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid, isSubmitting },
    } = useForm<BranchFormData>({
        mode: "onChange",
        resolver: zodResolver(branchSchema),
        defaultValues: {
            ...(isCreatingBranch
                ? {}
                : {
                      ...branch,
                      from: branch.workTime.from,
                      to: branch.workTime.to,
                  }),
        },
    });

    const handleAction = async (formData: BranchFormData) => {
        const res = toastShowResult(
            isCreatingBranch
                ? await createBranch({
                      ...formData,
                      workTime: {
                          from: formData.from,
                          to: formData.to,
                      },
                  })
                : await updateBranch({
                      updatedId: branch._id!,
                      branch: {
                          ...formData,
                          workTime: {
                              from: formData.from,
                              to: formData.to,
                          },
                      },
                  })
        );
        if (res.type === "success") {
            redirect(progectPathes.branches.path);
        }
    };
    return (
        <form
            className=" flex flex-col gap-4 py-6 w-full
                    lg:w-202
                    xl:gap-6 xl:w-219
                    "
            onSubmit={handleSubmit(handleAction)}
        >
            <div className="h2 text-f-blue-950 mb-6">
                {isCreatingBranch ? "Создание новго отделения" : "Обновление отделения"}
            </div>
            <Input
                {...register("title")}
                error={errors.title?.message}
                title="Название отделения"
            />
            <Input
                {...register("branchId")}
                error={errors.branchId?.message}
                title="Id отделения"
            />
            <Input {...register("city")} error={errors.city?.message} title="Город" />
            <Input {...register("adress")} error={errors.adress?.message} title="Адрес" />
            <Input {...register("zip_code")} error={errors.zip_code?.message} title="Индекс" />

            {/* //TODO  вынести временной интервал в Input
// */}

            <div className="flex flex-col gap-2">
                <div className="body-3 text-f-blue-500">Время работы</div>
                <div className="body-3 text-f-blue-950 bg-f-gray-50 p-4 rounded-lg w-full ">
                    <label>
                        <span>c </span>
                        <input type="time" {...register("from")} />
                    </label>
                    <label>
                        <span> до </span>
                        <input type="time" {...register("to")} />
                    </label>
                </div>
                <div className="body-3 text-f-error!">
                    {errors.from?.message ||
                        (errors.to?.message && <>{errors.from?.message || errors.to?.message}</>)}
                </div>
            </div>
            <Controller
                name="phone1"
                control={control}
                render={({ field }) => (
                    <PhoneControled
                        {...field}
                        title="Телефон отделения"
                        error={errors.phone1?.message}
                        placeholder={"Введите номер"}
                    />
                )}
            />
            <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="button-1 btn   text-f-white-100 bg-f-accent
                                disabled:bg-f-blue-disabled disabled:cursor-not-allowed
                                "
            >
                {isCreatingBranch ? "Сохранить" : "Обновить"}
            </button>
        </form>
    );
}
