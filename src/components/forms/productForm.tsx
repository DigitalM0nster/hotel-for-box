"use client";

import { CATEGORIES } from "@/data/constants/categories";
import { Input } from "../ui/FormElements/Input";
import Select from "../ui/FormElements/Select";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductFormData, productSchema } from "@/helpers/zod/validateZod";
import styles from "./productForm.module.scss";

// Продукт, который хранится внутри заказа.
// Используем те же поля, что и в OrderProduct (orderForm).
export type Product = {
	name: string;
	brand: string;
	category: string;
	size: string;
	color: string;
	price: number;
	quantity: number;
	weight: number;
	width_x: number;
	height_y: number;
	depth_z: number;
};

export default function ProductForm({ product, addOrUpdateProductFn, closeFn }: { product?: Product; addOrUpdateProductFn: (product: Product) => void; closeFn: () => void }) {
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
		<form className={styles.form} onSubmit={handleSubmit(handleAction)}>
			<Input {...register("name")} title="Название" error={errors.name?.message} />
			<Input {...register("brand")} title="Бренд" error={errors.brand?.message} />
			<div className={styles.columns}>
				<div className={styles.column}>
					<Select
						{...register("category")}
						options={CATEGORIES.map((catStr) => ({ title: catStr, value: catStr }))}
						title="Категория"
						disabledOption="Выбор категории"
						defaultValue={""}
						error={errors.category?.message}
					/>

					<div className={styles.inlineRow}>
						<Input {...register("size")} title="Размер" error={errors.size?.message} placeholder="Например: 42" />
						<Input {...register("color")} title="Цвет" error={errors.color?.message} placeholder="Например: красный" />
					</div>

					<Input {...register("price")} title="Цена" type="number" beforeText="$" error={errors.price?.message} />
				</div>
				<div className={styles.column}>
					<Controller
						name="quantity"
						control={control}
						render={({ field, fieldState: { error } }) => <Input {...field} title="Количество" type="counter" error={error?.message} />}
					/>

					<Input {...register("weight")} title="Вес" type="number" error={errors.weight?.message} placeholder="0.00" afterText="кг" />
					<div className={styles.dimensionsRow}>
						<Input {...register("width_x")} title="Ширина" type="number" error={errors.width_x?.message} afterText="см" placeholder="0.00" />
						<Input {...register("height_y")} title="Высота" type="number" error={errors.height_y?.message} afterText="см" placeholder="0.00" />

						<Input {...register("depth_z")} title="Глубина" type="number" error={errors.depth_z?.message} afterText="см" placeholder="0.00" />
					</div>
				</div>
			</div>
			<div className={styles.actionsRow}>
				<button className={styles.cancelButton} onClick={closeFn}>
					Отмена
				</button>
				<button type="submit" disabled={!isDirty} className={styles.submitButton}>
					{isNewProduct ? "Добавить" : "Обновить"}
				</button>
			</div>
		</form>
	);
}
