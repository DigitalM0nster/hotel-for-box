"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import "react-phone-input-2/lib/style.css";
import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/FormElements/Input";
import Select from "@/components/ui/FormElements/Select";
import { RegisterFormData, registerSchema } from "@/helpers/zod/validateZod";
import PhoneControled from "../ui/FormElements/Phone";
import { registerUser } from "@/libs/services/usersService";

type RegisterFormProps = {
	// Роль текущего авторизованного пользователя.
	// Нужна, чтобы понять, можно ли показывать поля "роль" и "подтверждён".
	currentAdminRole?: "user" | "admin" | "super";
	// Куда перенаправлять после успешного создания пользователя.
	// Если не передано — отправляем на страницу логина (для обычной регистрации).
	redirectToAfterSuccess?: string;
};

export default function RegisterForm({ currentAdminRole = "user", redirectToAfterSuccess }: RegisterFormProps) {
	const router = useRouter();

	const {
		register,
		handleSubmit,
		control,
		setError,
		formState: { errors, isValid, isSubmitting },
	} = useForm<RegisterFormData>({
		// Приводим к any, чтобы не ругался TS на мелкие расхождения типов между Zod и React Hook Form.
		resolver: zodResolver(registerSchema) as any,
		mode: "onChange",
	});

	const handleAction = async (formData: RegisterFormData) => {
		// Отправляем данные на бэкенд.
		const apiResult = await registerUser(formData);

		// Если бэкенд вернул "предупреждение" про уже занятый телефон или email,
		// не показываем общий toast, а подсвечиваем конкретные поля формы.
		if (apiResult.type === "warning") {
			if (apiResult.message.includes("телефон")) {
				setError("phone1", {
					type: "server",
					message: apiResult.message,
				});
				return;
			}

			if (apiResult.message.includes("email")) {
				setError("email", {
					type: "server",
					message: apiResult.message,
				});
				return;
			}
		}

		// Для остальных случаев (успех / общие ошибки) продолжаем использовать toast.
		const res = toastShowResult(apiResult);

		if (res.type === "success") {
			// Если форма используется в админке — возвращаемся в нужный раздел (например, список пользователей).
			// Если это обычная регистрация — отправляем на страницу логина.
			const target = redirectToAfterSuccess || "/login";
			router.push(target);
		}
	};

	const canChangeRole = currentAdminRole === "super";
	const canChangeVerified = currentAdminRole === "admin" || currentAdminRole === "super";
	const isAdminMode = currentAdminRole === "admin" || currentAdminRole === "super";
	const submitLabel = isAdminMode ? "Создать пользователя" : "Зарегистрироваться";

	return (
		<form onSubmit={handleSubmit(handleAction)} className="registerFormWrapper">
			{canChangeRole && (
				<Select
					{...register("role")}
					name="role"
					title="Роль пользователя"
					options={[
						{ title: "Пользователь", value: "user" },
						{ title: "Администратор", value: "admin" },
					]}
					disabledOption="Выберите роль"
				/>
			)}
			<Input {...register("email")} title="Email" placeholder="Email" type="email" error={errors?.email?.message} />
			{/* Имя ставим сразу под Email, как просили. */}
			<Input {...register("name")} title="Имя" placeholder="Имя" error={errors?.name?.message} />

			{/* Дополнительные поля профиля показываем, когда форму использует админ/суперадмин.
			    Фамилию и отчество размещаем сразу под полем "Имя". */}
			{isAdminMode && (
				<>
					<Input {...register("surname")} title="Фамилия" placeholder="Фамилия" error={errors?.surname?.message} />
					<Input {...register("patronymic")} title="Отчество" placeholder="Отчество" error={errors?.patronymic?.message} />
					<Input {...register("bithday")} title="День рождения" type="date" placeholder="День рождения" error={errors?.bithday?.message} />

					<Select
						{...register("gender")}
						name="gender"
						title="Пол"
						// В админской форме при создании пользователя тоже даём состояние "Пол не указан".
						options={[
							{ title: "Пол не указан", value: "" },
							{ title: "Мужской", value: "male" },
							{ title: "Женский", value: "female" },
						]}
					/>
				</>
			)}

			{/* Основной телефон всегда один и тот же смысл — номер для входа и связи. */}
			<Controller
				name="phone1"
				control={control}
				render={({ field }) => (
					<PhoneControled {...field} value={field.value || ""} title="Основной телефон" error={errors.phone1?.message} placeholder={"Введите основной номер"} />
				)}
			/>

			{/* Для админа/суперадмина сразу под основным телефоном показываем дополнительный,
			    с пояснением зачем он нужен. */}
			{isAdminMode && (
				<Controller
					name="phone2"
					control={control}
					render={({ field }) => (
						<PhoneControled
							{...field}
							value={field.value || ""}
							title="Дополнительный телефон"
							error={errors.phone2?.message}
							placeholder={"Телефон для связи, если основной недоступен (необязательно)"}
						/>
					)}
				/>
			)}

			<Input {...register("password")} placeholder="Пароль" error={errors.password?.message} hideEye min={8} />
			<Input {...register("confirmPassword")} placeholder="Подтверждение пароля" error={errors.confirmPassword?.message} hideEye min={8} />

			{isAdminMode && (
				<>
					<Input {...register("city")} title="Город" placeholder="Город" error={errors?.city?.message} />
					<Input {...register("adress")} title="Адрес" placeholder="Адрес" error={errors?.adress?.message} />
					<Input {...register("zip_code")} title="Почтовый индекс" placeholder="Почтовый индекс" error={errors?.zip_code?.message} />
					<Input {...register("notifications")} type="checkbox" title="Получать уведомления" />
				</>
			)}

			{canChangeVerified && <Input {...register("isVerifiedByAdmin")} type="checkbox" title="Подтверждён администратором" />}

			{/* 
				Кнопка всегда активна (кроме момента отправки).
				Валидация и подсветка обязательных полей выполняются при сабмите через Zod + React Hook Form.
				Ошибки прилетают в объект errors и передаются в инпуты через проп error.
			*/}
			<button type="submit" disabled={isSubmitting} className="registerFormSubmitButton">
				{submitLabel}
			</button>
		</form>
	);
}
