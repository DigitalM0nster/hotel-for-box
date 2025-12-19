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
import Select from "../ui/FormElements/Select";

export default function BranchForm({ branch, redirectTo }: { branch: IBranch | null; redirectTo?: string }) {
	const isCreatingBranch = !!!branch;

	// Подготовка списка времён с 05:00 до 23:55 с шагом 5 минут,
	// чтобы можно было выбрать точное время, не печатая его руками.
	const workTimeOptions = [];
	for (let hour = 5; hour <= 23; hour += 1) {
		for (let minute = 0; minute < 60; minute += 5) {
			const hh = hour.toString().padStart(2, "0");
			const mm = minute.toString().padStart(2, "0");
			workTimeOptions.push(`${hh}:${mm}`);
		}
	}

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
						// Здесь мы отправляем на бэкенд только бизнес-данные,
						// а ID отделения будет сгенерирован автоматически на сервере.
						...formData,
						workTime: {
							from: formData.from,
							to: formData.to,
						},
				  })
				: await updateBranch({
						updatedId: branch._id!,
						branch: {
							// При обновлении так же не трогаем ID отделения — он уже хранится в базе.
							...formData,
							workTime: {
								from: formData.from,
								to: formData.to,
							},
						},
				  })
		);
		if (res.type === "success") {
			// Если явно передали redirectTo (например, из админки), используем его,
			// иначе ведём на пользовательскую страницу отделений.
			redirect(redirectTo || progectPathes.branches.path);
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
			<div className="h2 text-f-blue-950 mb-6">{isCreatingBranch ? "Создание нового отделения" : "Обновление отделения"}</div>
			<Input {...register("title")} error={errors.title?.message} title="Название отделения" />

			{/* При создании ID не запрашиваем, при редактировании просто показываем его как текст */}
			{!isCreatingBranch && branch && (
				<div>
					<div>ID для склада:</div>
					<div>#{branch.branchId}</div>
				</div>
			)}

			{/* Выбор страны: Россия или Монголия */}
			<Select
				{...register("country")}
				title="Страна"
				disabledOption="Выберите страну"
				options={[
					{ value: "Россия", title: "Россия" },
					{ value: "Монголия", title: "Монголия" },
				]}
				error={errors.country?.message}
			/>

			<Input {...register("city")} error={errors.city?.message} title="Город" />
			<Input {...register("adress")} error={errors.adress?.message} title="Адрес" />
			<Input {...register("zip_code")} error={errors.zip_code?.message} title="Индекс" />

			{/* Время работы: выбираем из списка, чтобы не печатать руками */}
			<div className="flex flex-col gap-2">
				<div className="body-3 text-f-blue-500">Время работы</div>
				<div className="body-3 text-f-blue-950 bg-f-gray-50 p-4 rounded-lg w-full ">
					<label>
						<span>c </span>
						<select {...register("from")}>
							<option value="">Выберите время</option>
							{workTimeOptions.map((time) => (
								<option key={time} value={time}>
									{time}
								</option>
							))}
						</select>
					</label>
					<label>
						<span> до </span>
						<select {...register("to")}>
							<option value="">Выберите время</option>
							{workTimeOptions.map((time) => (
								<option key={time} value={time}>
									{time}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="body-3 text-f-error!">{errors.from?.message || (errors.to?.message && <>{errors.from?.message || errors.to?.message}</>)}</div>
			</div>
			<Controller
				name="phone1"
				control={control}
				render={({ field }) => <PhoneControled {...field} title="Телефон отделения" error={errors.phone1?.message} placeholder={"Введите номер"} />}
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
