"use client";

import Link from "next/link";
import { Input } from "../ui/FormElements/Input";
import Select from "../ui/FormElements/Select";
import { Controller, useForm } from "react-hook-form";
import PhoneControled from "../ui/FormElements/Phone";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserFormData, updateUserSchema } from "@/helpers/zod/validateZod";
// import "react-phone-input-2/lib/style.css";
import { IUser, IUserRole } from "@/mongodb/models/userModel";
import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { updateUser } from "@/libs/services/usersService";
import styles from "./updateUserForm.module.scss";

type UpdateUserFormProps = {
	user: IUser;
	// Роль текущего авторизованного пользователя (админ/суперадмин).
	// В кабинете обычного пользователя это поле не передаём.
	currentAdminRole?: IUserRole;
	// Показывать ли ссылку "Поменять пароль".
	// В своём кабинете пользователя — да, в админском режиме редактирования других — нет.
	showChangePasswordLink?: boolean;
};

export default function UpdateUserForm({ user, currentAdminRole, showChangePasswordLink = true }: UpdateUserFormProps) {
	type FormValues = Required<UpdateUserFormData>;

	const defaultValues: FormValues = {
		...user,
		name: user.name || "",
		surname: user.surname || "",
		patronymic: user.patronymic || "",
		gender: user.gender || "",
		phone1: user.phone1 || "",
		phone2: user.phone2 || "",
		city: user.city || "",
		adress: user.adress || "",
		zip_code: user.zip_code || "",
		notifications: Boolean(user.notifications),
		isVerifiedByAdmin: Boolean(user.isVerifiedByAdmin),
		role: user.role || "user",
		bithday: user.birthday ? new Date(user.birthday).toISOString().split("T")[0] : "",
	};

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isValid, isSubmitting, isDirty },
	} = useForm<FormValues>({
		resolver: zodResolver(updateUserSchema) as any,
		mode: "onChange",
		defaultValues,
	});
	const handleAction = async (formData: FormValues) => {
		toastShowResult(await updateUser({ ...formData, fullData: true, id: user._id! }));
		reset(formData);
	};

	return (
		<form onSubmit={handleSubmit(handleAction)} className={styles.formWrapper}>
			<div className={styles.formGrid}>
				<div className={styles.column}>
					{/* Показываем человекочитаемый ID (publicId), а при его отсутствии — внутренний _id. */}
					<div className={styles.readonlyField}>
						<div className={styles.readonlyLabel}>ID пользователя</div>
						<div className={styles.readonlyValue}>{user.publicId || user._id}</div>
					</div>

					{/* Поле роли показываем только суперадмину в админских формах. */}
					{currentAdminRole === "super" && (
						<>
							{user.role === "super" ? (
								<div className={styles.readonlyField}>
									<div className={styles.readonlyLabel}>Роль пользователя</div>
									<div className={styles.readonlyValue}>Суперадминистратор</div>
								</div>
							) : (
								<Select
									{...register("role")}
									title="Роль пользователя"
									name="role"
									options={[
										{ title: "Пользователь", value: "user" },
										{ title: "Администратор", value: "admin" },
									]}
									disabledOption="Выберите роль"
								/>
							)}
						</>
					)}
					<Input {...register("name")} title="Имя" required error={errors.name?.message} />
					<Input {...register("surname")} title="Фамилия" error={errors.surname?.message} />
					<Input {...register("patronymic")} title="Отчество" error={errors.patronymic?.message} />

					<Input {...register("bithday")} type="date" title="День рождения" error={errors.bithday?.message} />

					{/* Email также показываем как нередактируемое поле в общем блоке. */}
					<div className={styles.readonlyField}>
						<div className={styles.readonlyLabel}>Email (не редактируется)</div>
						<div className={styles.readonlyValue}>{user.email}</div>
					</div>

					<Select
						{...register("gender")}
						title="Пол"
						name="gender"
						// Даём возможность явно выбрать состояние "Пол не указан".
						options={[
							{ title: "Пол не указан", value: "" },
							{ title: "Мужской", value: "male" },
							{ title: "Женский", value: "female" },
						]}
					/>
				</div>
				<div className={styles.column}>
					<Controller
						name="phone1"
						control={control}
						render={({ field }) => <PhoneControled {...field} title="Основной телефон" error={errors.phone1?.message} placeholder={"Введите номер"} />}
					/>
					<Controller
						name="phone2"
						control={control}
						render={({ field }) => (
							<PhoneControled {...field} value={field.value || ""} title="Дополнительный телефон" error={errors.phone2?.message} placeholder={"Введите номер"} />
						)}
					/>
					<Input {...register("city")} title="Город" error={errors.city?.message} min={2} max={15} />
					<Input {...register("adress")} title="Адрес" error={errors.adress?.message} min={2} max={15} />
					<Input {...register("zip_code")} title="Почтовый индекс" error={errors.zip_code?.message} />
				</div>
			</div>

			<Input {...register("notifications")} type="checkbox" title="Получать уведомления" />
			{/* Флаг подтверждения показываем только администратору/суперадмину. */}
			{(currentAdminRole === "admin" || currentAdminRole === "super") && <Input {...register("isVerifiedByAdmin")} type="checkbox" title="Подтверждён администратором" />}

			<div className={styles.actions}>
				{/* Ссылку на смену пароля показываем только в личном кабинете самого пользователя. */}
				{showChangePasswordLink && (
					<Link href={"/user/change_password"} className={styles.changePassword}>
						Поменять пароль
					</Link>
				)}
				<button type="submit" disabled={!(isDirty && isValid && !isSubmitting)} className={styles.submitButton}>
					Сохранить
				</button>
			</div>
		</form>
	);
}
