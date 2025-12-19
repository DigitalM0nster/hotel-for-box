import { INPUT_VALIDATE } from "@/data/constants/inputValidate";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

// Схема телефона: строка (обязательная) + человекочитаемые сообщения об ошибках.
// Здесь нельзя использовать новые поля required_error / invalid_type_error (версия Zod в проекте старее),
// поэтому мы отдельно проверяем пустую строку и тип.
export const phoneSchema = z
	.string()
	.min(1, "Укажите номер телефона")
	.refine(
		(value) => {
			return isValidPhoneNumber(`+${value}`);
		},
		{
			message: "Некорректный номер телефона",
		}
	);

export const dateSchema = z.string().refine((val) => new Date(val).getTime() < new Date().getTime(), "Некорректный формат даты");

export const universalTaxIdSchema = z
	.string()
	.trim()
	.regex(/^\d+$/, "Только цифры, без пробелов и символов")
	.refine((val) => [9, 10, 12].includes(val.length), {
		message: "Длина должна быть 9, 10 или 12 цифр (УНП, ИНН, ИИН)",
	});

// удобные хелперы для опциональных строковых полей
const optionalString = z.string().optional().default("");
const optionalName = optionalString.refine((val) => val === "" || INPUT_VALIDATE.name.reg.test(val), {
	message: INPUT_VALIDATE.name.defErrorMsg,
});

export const registerSchema = z
	.object({
		name: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
		email: z.string().email("Пожалуйста, укажите действительный адрес электронной почты."),
		phone1: phoneSchema,
		password: z.string().regex(INPUT_VALIDATE.password.reg, INPUT_VALIDATE.password.defErrorMsg),
		confirmPassword: z.string(),
		// Эти поля нужны только когда пользователя создаёт админ/суперадмин.
		// Обычный пользователь их не видит и не заполняет.
		role: z.enum(["user", "admin", "super"]).optional(),
		// Делаем поле обязательным в типах, но с дефолтом false,
		// чтобы в React Hook Form всегда был boolean, даже если чекбокс не рендерится.
		isVerifiedByAdmin: z.boolean().default(false),
		// Дополнительные поля профиля, чтобы админ мог сразу заполнить все данные пользователя при создании.
		surname: optionalName,
		patronymic: optionalName,
		bithday: optionalString.refine((val) => val === "" || dateSchema.safeParse(val).success, {
			message: "Некорректный формат даты",
		}),
		gender: optionalString,
		phone2: optionalString.refine((val) => val === "" || phoneSchema.safeParse(val).success, {
			message: "Некорректный номер телефона",
		}),
		city: optionalString.refine((val) => val === "" || val.length >= 2, { message: "Укажите свой город" }),
		adress: optionalString.refine((val) => val === "" || val.length >= 2, { message: "Укажите свой адрес" }),
		zip_code: optionalString.refine((val) => val === "" || /^\d{5}(-\d{4})?$/.test(val), {
			message: "Некорректный ZIP-код (ожидается 12345 или 12345-6789)",
		}),
		notifications: z.boolean().optional().default(true),
	})
	.refine((data) => data.password === data.confirmPassword, {
		path: ["confirmPassword"],
		message: "Пароли не совпадают",
	})
	.refine(
		(data) => {
			// если второй телефон заполнен, проверяем что он отличается от первого
			if (!data.phone2) return true;
			return data.phone1 !== data.phone2;
		},
		{
			path: ["phone2"],
			message: "У вас уже указан этот телефон как основной",
		}
	);
export type RegisterFormData = z.infer<typeof registerSchema>;

export const updateUserSchema = z
	.object({
		// имя оставляем обязательным
		name: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
		// фамилия опциональна
		surname: optionalName,
		patronymic: optionalName,

		bithday: optionalString.refine((val) => val === "" || dateSchema.safeParse(val).success, {
			message: "Некорректный формат даты",
		}),
		notifications: z.boolean(),
		// флаг ручного подтверждения администратором
		isVerifiedByAdmin: z.boolean().optional().default(false),
		// роль пользователя (нужна только в админке)
		role: z.enum(["user", "admin", "super"]).optional(),
		// пол опционален
		gender: optionalString,

		phone1: phoneSchema,
		phone2: optionalString.refine((val) => val === "" || phoneSchema.safeParse(val).success, {
			message: "Некорректный номер телефона",
		}),

		city: optionalString.refine((val) => val === "" || val.length >= 2, { message: "Укажите свой город" }),
		adress: optionalString.refine((val) => val === "" || val.length >= 2, { message: "Укажите свой адрес" }),
		zip_code: optionalString.refine((val) => val === "" || /^\d{5}(-\d{4})?$/.test(val), { message: "Некорректный ZIP-код (ожидается 12345 или 12345-6789)" }),
	})
	.refine(
		(data) => {
			// если второй телефон заполнен, проверяем что он отличается от первого
			if (!data.phone2) return true;
			return data.phone1 !== data.phone2;
		},
		{
			path: ["phone2"],
			message: "У вас уже указан этот телефон как основной",
		}
	);
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

//!ADRESS
const generalFields = z.object({
	country: z.string().min(2, "Укажите страну"),
	city: z.string().min(2, "Укажите город"),
	adress: z.string().min(2, "Укажите адрес"),
	deliveryMethod: z.enum(["warehouse", "courier"]),
	phone1: phoneSchema,
	phone2: phoneSchema,
});
// делаем две базовые схемы с литералом
const adressBaseSchemaTrue = generalFields.extend({
	isBusiness: z.literal(true),
});

const adressBaseSchemaFalse = generalFields.extend({
	isBusiness: z.literal(false),
});

//бизнес
const adressBusinessSchema = adressBaseSchemaTrue.extend({
	companyName: z.string().min(2, "Укажите полное назвние компании"),
});

//персонал
const adressPersonalSchema = adressBaseSchemaFalse.extend({
	recipientName: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
	recipientSurname: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
	recipientPatronymic: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
	recipientBirthDate: dateSchema,
	recipientEmail: z.string().email("Пожалуйста, укажите действительный адрес электронной почты."),
	recipientInnNumber: universalTaxIdSchema,
	passportSeriesNumber: z.string(),
	passportIssuedBy: z.string(),
	passportIssuedDate: dateSchema,
});
export const adressSchema = z.discriminatedUnion("isBusiness", [adressBusinessSchema, adressPersonalSchema]).refine((data) => data.phone1 !== data.phone2, {
	path: ["phone2"],
	message: "У вас уже указан этот телефон как основной",
});
export type AdressSchemaFormData = z.infer<typeof adressSchema>;

//!BRANCH
export const branchSchema = z.object({
	title: z.string().min(2, "Укажите название"),
	country: z.enum(["Россия", "Монголия"], {
		message: "Выберите страну",
	}), // Страна отделения: только Россия или Монголия
	city: z.string().min(2, "Укажите город"),
	adress: z.string().min(2, "Укажите адрес"),
	// Для отделений нам не нужна жесткая американская маска ZIP,
	// поэтому разрешаем просто индекс из 3–10 цифр.
	zip_code: z.string().regex(/^\d{3,10}$/, {
		message: "Некорректный индекс (ожидаются только цифры)",
	}),
	phone1: phoneSchema,
	from: z.string().min(2, "Укажите с какого времени начинает работать отделение"),
	to: z.string().min(2, "Укажите до какого времени начинает работать отделение"),
});

export type BranchFormData = z.infer<typeof branchSchema>;

//!PRODUCT

export const productSchema = z.object({
	name: z.string().min(2, "Укажите название"),
	brand: z.string().min(2, "Укажите бренд"),
	category: z.string().min(2, "Выберете категорию товара"),
	size: z.string(), //.min(1, "Выберете размер товара"),
	color: z.string(), //.min(2, "Выберете цвет товара"),
	price: z.coerce.number().min(0.01, "Укажите стоимость товара"), //.min(0.01, "Укажите стоимость товара"),
	quantity: z.coerce.number().gt(0, "Укажите количество товара"),
	weight: z.coerce.number().gt(0, "Укажите вес товара"),
	width_x: z.coerce.number().gt(0, "Укажите ширину товара"),
	depth_z: z.coerce.number().gt(0, "Укажите глубину товара"),
	height_y: z.coerce.number().gt(0, "Укажите высоту товара"),
});

export type ProductFormData = z.infer<typeof productSchema>;

//!FLIGHT
export const flightSchema = z.object({
	code: z.string().min(2, "Укажите код рейса"),
	fromCountry: z.string().min(2, "Укажите страну отправления"),
	toCountry: z.string().min(2, "Укажите страну назначения"),
	fromBranchId: z.string().optional().nullable(),
	toBranchId: z.string().optional().nullable(),
	plannedDepartureAt: z.string().optional().nullable(),
	plannedArrivalAt: z.string().optional().nullable(),
	admin_description: z.string().optional().nullable(),
});

export type FlightFormData = z.infer<typeof flightSchema>;

//!BAG
export const bagSchema = z.object({
	name: z.string().min(2, "Укажите название сумки"),
	weightKg: z.preprocess((val) => (typeof val === "string" ? parseFloat(val) : val), z.number().min(0.01, "Укажите вес сумки в килограммах")),
	orderIds: z.array(z.string()).default([]), // Массив orderId заказов
	admin_description: z.string().optional().nullable(),
});

export type BagFormData = z.infer<typeof bagSchema>;
