"use client";

import { CATEGORIES } from "@/data/constants/categories";
import { Input } from "../ui/FormElements/Input";
import Select from "../ui/FormElements/Select";
import { CLOTHINGSIZES } from "@/data/constants/clothingSizes";
import { IProduct } from "@/mongodb/models/productModel";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductFormData, productSchema } from "@/helpers/zod/validateZod";

export type Product = Omit<IProduct, "_id" | "createdAt" | "orderId" | "description" | "status">;

export default function ProductForm({
    product,
    addOrUpdateProductFn,
    closeFn,
}: {
    product?: Product;
    addOrUpdateProductFn: (product: Product) => void;
    closeFn: () => void;
}) {
    const isNewProduct = !!!product;
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid, isDirty },
    } = useForm<ProductFormData>({
        mode: "onChange",
        resolver: zodResolver(productSchema) as any,
        defaultValues: product || {
            quantity: 1,
        },
    });

    const handleAction = (fd: ProductFormData) => {
        console.log(fd);
        addOrUpdateProductFn(fd);
    };

    return (
        <div>
            <form className="  flex flex-col gap-2" onSubmit={handleSubmit(handleAction)}>
                <Input {...register("name")} title="Название" error={errors.name?.message} />
                <Input {...register("brand")} title="Бренд" error={errors.brand?.message} />
                <div className="flex gap-4 w-full">
                    <div className="w-full">
                        <Select
                            {...register("category")}
                            options={CATEGORIES.map((catStr) => ({ title: catStr, value: catStr }))}
                            title="Категория"
                            disabledOption="Выбор категории"
                            defaultValue={""}
                            error={errors.category?.message}
                        />

                        <div className="flex gap-4 *:w-full">
                            <Select
                                {...register("size")}
                                options={CLOTHINGSIZES.map((sizeStr) => ({
                                    title: sizeStr,
                                    value: sizeStr,
                                }))}
                                title="Размер"
                                disabledOption="Выбор Размерa"
                                defaultValue={""}
                                error={errors.size?.message}
                            />
                            <Controller
                                name="color"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Select
                                        {...field}
                                        title="Цвет"
                                        colors
                                        error={fieldState.error?.message}
                                    />
                                )}
                            />
                        </div>

                        <Input
                            {...register("price")}
                            title="Цена"
                            type="number"
                            beforeText="$"
                            error={errors.price?.message}
                        />
                    </div>
                    <div className="w-full">
                        <Controller
                            name="quantity"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <Input
                                    {...field}
                                    title="Количество"
                                    type="counter"
                                    error={error?.message}
                                />
                            )}
                        />

                        <Input
                            {...register("weight")}
                            title="Вес"
                            type="number"
                            error={errors.weight?.message}
                            placeholder="0.00"
                            afterText="кг"
                        />
                        <div className="flex gap-4">
                            <Input
                                {...register("width_x")}
                                title="Ширина"
                                type="number"
                                error={errors.width_x?.message}
                                afterText="см"
                                placeholder="0.00"
                            />
                            <Input
                                {...register("height_y")}
                                title="Высота"
                                type="number"
                                error={errors.height_y?.message}
                                afterText="см"
                                placeholder="0.00"
                            />

                            <Input
                                {...register("depth_z")}
                                title="Глубина"
                                type="number"
                                error={errors.depth_z?.message}
                                afterText="см"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 justify-between">
                    <button
                        className="button-1 btn   text-f-white-100 bg-f-error
                                disabled:bg-f-blue-disabled disabled:cursor-not-allowed
                                "
                        onClick={closeFn}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        disabled={!isDirty}
                        className="button-1 btn   text-f-white-100 bg-f-accent
                                disabled:bg-f-blue-disabled disabled:cursor-not-allowed
                                "
                    >
                        {isNewProduct ? "Добавить" : "Обновить"}
                    </button>
                </div>
            </form>
        </div>
    );
}
