import { INPUT_VALIDATE } from "@/data/constants/inputValidate";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export const phoneSchema = z.string().refine(
    (value) => {
        return isValidPhoneNumber(`+${value}`);
    },
    {
        message: "Некорректный номер телефона",
    }
);

export const dateSchema = z
    .string()
    .refine((val) => new Date(val).getTime() < new Date().getTime(), "Некорректный формат даты");

export const universalTaxIdSchema = z
    .string()
    .trim()
    .regex(/^\d+$/, "Только цифры, без пробелов и символов")
    .refine((val) => [9, 10, 12].includes(val.length), {
        message: "Длина должна быть 9, 10 или 12 цифр (УНП, ИНН, ИИН)",
    });

export const registerSchema = z
    .object({
        name: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
        email: z.string().email("Пожалуйста, укажите действительный адрес электронной почты."),
        phone1: phoneSchema,
        password: z
            .string()
            .regex(INPUT_VALIDATE.password.reg, INPUT_VALIDATE.password.defErrorMsg),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Пароли не совпадают",
    });
export type RegisterFormData = z.infer<typeof registerSchema>;

export const updateUserSchema = z
    .object({
        name: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
        surname: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),
        patronymic: z.string().regex(INPUT_VALIDATE.name.reg, INPUT_VALIDATE.name.defErrorMsg),

        bithday: dateSchema,
        notifications: z.boolean(),
        gender: z.string(),

        phone1: phoneSchema,
        phone2: phoneSchema,

        city: z.string().min(2, "Укажите свой город"),
        adress: z.string().min(2, "Укажите свой адресс"),
        zip_code_eng: z.string().regex(/^\d{5}(-\d{4})?$/, {
            message: "Некорректный ZIP-код (ожидается 12345 или 12345-6789)",
        }),
    })
    .refine((data) => data.phone1 !== data.phone2, {
        path: ["phone2"],
        message: "У вас уже указан этот телефон как основной",
    });
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

//!ADRESS
const generalFields = z.object({
    country: z.string().min(2, "Укажите страну"),
    city: z.string().min(2, "Укажите город"),
    adress: z.string().min(2, "Укажите адресс"),
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
export const adressSchema = z
    .discriminatedUnion("isBusiness", [adressBusinessSchema, adressPersonalSchema])
    .refine((data) => data.phone1 !== data.phone2, {
        path: ["phone2"],
        message: "У вас уже указан этот телефон как основной",
    });
export type AdressSchemaFormData = z.infer<typeof adressSchema>;

//!BRANCH
export const branchSchema = z.object({
    title: z.string().min(2, "Укажите название"),
    branchId: z.string().min(2, "Укажите ID отделения"),
    city: z.string().min(2, "Укажите город"),
    adress: z.string().min(2, "Укажите адресс"),
    zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, {
        message: "Некорректный ZIP-код (ожидается 12345 или 12345-6789)",
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
