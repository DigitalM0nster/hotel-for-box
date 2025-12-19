"use server";

import { auth } from "@/auth";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { UpdateUserFormData } from "@/helpers/zod/validateZod";
import { INPUT_VALIDATE } from "@/data/constants/inputValidate";
import { connectDB } from "@/mongodb/connect";
import { AdressModel, IAdress } from "@/mongodb/models/adressModel";
import { IUser, UserModel } from "@/mongodb/models/userModel";
import { IActionResult } from "@/types/types";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import crypto from "crypto";

//! РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
// Базовый набор полей для создания пользователя + опции,
// которые могут передать администраторы (роль и подтверждённость).
type IUserCreateProps = OnlyRequired<IUser> &
	Partial<IUser> & {
		role?: IUser["role"];
		isVerifiedByAdmin?: boolean;
	};

// Генерация короткого, но масштабируемого публичного ID для пользователя.
// Формат: U + 10 цифр (только числа), например U0000123456.
// Пространство значений 10^10, чего достаточно даже для миллиардов пользователей,
// при этом мы дополнительно проверяем уникальность в БД.
const generateUserPublicId = async (): Promise<string> => {
	while (true) {
		// Берём 6 байт случайных данных, превращаем в большое число и
		// берём по модулю 10^10, чтобы получить 10-значное число.
		const randomBytes = crypto.randomBytes(6).toString("hex");
		const asNumber = parseInt(randomBytes, 16);
		const digits = (asNumber % 10_000_000_000).toString().padStart(10, "0");
		const candidate = `U${digits}`;

		// Проверяем, что такого ID ещё нет в базе.
		const exists = await UserModel.exists({ publicId: candidate });
		if (!exists) return candidate;
		// В крайне маловероятном случае коллизии просто попробуем ещё раз.
	}
};
export const registerUser = async (user: IUserCreateProps): Promise<IActionResult> => {
	try {
		// 1. Определяем, кто именно создаёт пользователя.
		// Если это неадмин/гость — он не может управлять ролью и подтверждением.
		const session = await auth();
		const creatorRole = session?.user.role ?? "user";

		await connectDB();

		//check
		if (await UserModel.findOne({ phone1: user.phone1 })) throw new Error("Указанный телефон уже используется другим пользователем.");

		if (await UserModel.findOne({ email: user.email })) throw new Error("Указанный email уже используется другим пользователем.");

		// 2. Определяем, какие значения роли и подтверждённости можно применить.
		let safeRole: IUser["role"] = "user";
		let safeIsVerifiedByAdmin = false;

		if (creatorRole === "super") {
			// Суперадмин может создать:
			// - обычного пользователя
			// - администратора
			// - ещё одного суперадмина
			if (user.role === "admin" || user.role === "user" || user.role === "super") {
				safeRole = user.role;
			}
			// Суперадмин также может сразу пометить пользователя как подтверждённого.
			safeIsVerifiedByAdmin = Boolean(user.isVerifiedByAdmin);
		} else if (creatorRole === "admin") {
			// Админ всегда создаёт только обычного пользователя,
			// но может сразу отметить его подтверждённым.
			safeRole = "user";
			safeIsVerifiedByAdmin = Boolean(user.isVerifiedByAdmin);
		} else {
			// Обычный пользователь (регистрация с сайта) — всегда роль user,
			// подтверждённость только false (ожидает ручного подтверждения).
			safeRole = "user";
			safeIsVerifiedByAdmin = false;
		}

		// 3. Создаём пользователя. Берём пришедшие данные,
		// но явно переопределяем роль и флаг подтверждения безопасными значениями.
		const newUser = new UserModel();
		Object.assign(newUser, user);
		newUser.role = safeRole;
		newUser.isVerifiedByAdmin = safeIsVerifiedByAdmin;

		// Если с фронта пришёл пустой пол (""), приводим его к "значение отсутствует",
		// чтобы не ломать enum ["male", "female"] в Mongoose-схеме.
		const genderFromClient = (user as Partial<Record<keyof IUser, unknown>>).gender;
		if (genderFromClient === "") {
			(newUser as Partial<IUser>).gender = undefined;
		}

		// Генерируем человекочитаемый publicId, если он ещё не задан.
		if (!newUser.publicId) {
			newUser.publicId = await generateUserPublicId();
		}

		//hash pass
		const hashedPassword = await bcrypt.hash(user.password, 10);
		newUser.password = hashedPassword;

		await newUser.save();
		// Сообщение об успешном создании пользователя.
		// Будет показано и при регистрации обычного пользователя, и при создании пользователя админом.
		return { type: "success", message: "Вы успешно создали пользователя" };
	} catch (error) {
		console.log("ERROR 👎", error);
		if (error instanceof Error) {
			return { type: "warning", message: error.message };
		}
		return { type: "error", message: "Ошибка операции, повторите позже." };
	}
};

//! ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
type IUserUpdateProps = UpdateUserFormData & { id: string; fullData: boolean };
export const updateUser = async (user: IUserUpdateProps): Promise<IActionResult> => {
	const { id, ...updateFields } = user;
	try {
		// 1. Определяем, кто выполняет обновление.
		const session = await auth();
		if (!session) throw new Error("Требуется авторизация");

		await connectDB();

		const currentUser = await UserModel.findById(id);

		// 2. Проверяем, что пользователь существует.
		if (!currentUser) throw new Error("Пользователь не найден");

		const isSuper = session.user.role === "super";
		const isAdmin = session.user.role === "admin";
		const isSelf = session.user.id === id;

		// 3. Ограничиваем, кто может редактировать какие данные.
		// - Обычный пользователь может менять только СВОЙ профиль.
		// - Админ/суперадмин могут редактировать любых пользователей.
		if (!isAdmin && !isSuper && !isSelf) {
			throw new Error("У вас нет прав редактировать этого пользователя");
		}

		if (await UserModel.findOne({ phone1: user.phone1, _id: { $ne: currentUser._id } })) throw new Error("Указанный телефон уже используется другим пользователем.");

		// 4. очищаем необязательные поля, если пришла пустая строка — чтобы не ломать enum/валидацию в модели
		const cleanedFields: Partial<IUserUpdateProps> = { ...updateFields };
		const optionalStringKeys: Array<keyof IUserUpdateProps> = ["surname", "patronymic", "gender", "phone2", "city", "adress", "zip_code"];
		optionalStringKeys.forEach((key) => {
			if (cleanedFields[key] === "") {
				delete cleanedFields[key];
			}
		});

		// 5. Обрабатываем специальные админские поля.
		// Обычный пользователь НЕ может сам себе менять роль и подтверждённость.
		if (!isAdmin && !isSuper) {
			delete (cleanedFields as Partial<IUserUpdateProps> & { role?: IUser["role"]; isVerifiedByAdmin?: boolean }).role;
			delete (cleanedFields as Partial<IUserUpdateProps> & { role?: IUser["role"]; isVerifiedByAdmin?: boolean }).isVerifiedByAdmin;
		} else {
			// Админ может менять только флаг isVerifiedByAdmin,
			// но не может трогать роль пользователя.
			if (!isSuper) {
				delete (cleanedFields as Partial<IUserUpdateProps> & { role?: IUser["role"] }).role;
			} else {
				// Суперадмин может менять роль пользователя,
				// но есть два важных ограничения:
				// 1) нельзя менять роль у другого суперадмина;
				// 2) допустимые значения: "user", "admin", "super".
				const nextRole = (cleanedFields as Partial<IUserUpdateProps> & { role?: IUser["role"] }).role;

				// Если редактируемый пользователь уже суперадмин — не даём менять ему роль вообще.
				if (currentUser.role === "super") {
					delete (cleanedFields as Partial<IUserUpdateProps> & { role?: IUser["role"] }).role;
				} else if (nextRole && nextRole !== "user" && nextRole !== "admin" && nextRole !== "super") {
					// На всякий случай отсекаем любые другие значения, если кто-то подменил запрос.
					delete (cleanedFields as Partial<IUserUpdateProps> & { role?: IUser["role"] }).role;
				}
			}
		}

		// обновляем только переданные поля
		Object.assign(currentUser, cleanedFields);

		// дата рождения может быть пустой: пишем только если есть значение
		if (user.bithday) {
			currentUser.birthday = new Date(user.bithday).toISOString();
		}

		await currentUser.save();
		return { type: "success", message: "Ваши данные успешно обновлены" };
	} catch (error) {
		if (error instanceof Error) {
			return { type: "warning", message: error.message };
		}
		return { type: "error", message: "Ошибка операции, повторите позже." };
	}
};

//! Пользователь со всеми адресами
export const getUserWithAdresses = async () => {
	try {
		const session = await auth();
		if (!session) throw new Error("Требуется авторизация");
		await connectDB();
		const user = await UserModel.findById(session.user.id).populate<{ addresses: IAdress[] }>("adresses").lean<IUser>();

		if (!user || user.is_blocked) throw new Error("Требуется авторизация");
		return normalizeDbRes<IUser>(user);
	} catch (error) {
		redirect("/login");
	}
};

export const getCurrentUser = async () => {
	try {
		const session = await auth();
		if (!session) throw new Error("Требуется авторизация");

		await connectDB();
		const currentUser = await UserModel.findById(session.user.id);
		if (!currentUser || currentUser.is_blocked) throw new Error("Требуется авторизация");

		return normalizeDbRes<IUser>(currentUser);
	} catch (error) {
		redirect("/login");
	}
};

//! СМЕНА ПАРОЛЯ
type ChangePasswordProps = {
	oldPassword: string;
	newPassword: string;
};
export const changePassword = async ({ oldPassword, newPassword }: ChangePasswordProps): Promise<IActionResult> => {
	try {
		const session = await auth();
		if (!session) throw new Error("Требуется авторизация");

		if (!INPUT_VALIDATE.password.reg.test(newPassword)) {
			return { type: "warning", message: INPUT_VALIDATE.password.defErrorMsg };
		}

		if (oldPassword === newPassword) {
			return { type: "warning", message: "Новый пароль должен отличаться от старого." };
		}

		await connectDB();
		const currentUser = await UserModel.findById(session.user.id);
		if (!currentUser || currentUser.is_blocked) throw new Error("Требуется авторизация");

		const isOldPasswordValid = await bcrypt.compare(oldPassword, currentUser.password);
		if (!isOldPasswordValid) return { type: "warning", message: "Старый пароль неверен." };

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		currentUser.password = hashedPassword;
		await currentUser.save();

		return { type: "success", message: "Пароль успешно обновлён." };
	} catch (error) {
		if (error instanceof Error) {
			return { type: "warning", message: error.message };
		}
		return { type: "error", message: "Ошибка операции, повторите позже." };
	}
};

//! АДМИНСКИЕ СЕРВИСЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ

export type GetUsersForAdminParams = {
	// Номер страницы, начинается с 1.
	page?: number;
	// Сколько записей на странице.
	limit?: number;
	// По какому полю сортируем.
	sortField?: "createdAt" | "email" | "name" | "city" | "role";
	// Направление сортировки.
	sortDirection?: "asc" | "desc";

	// Фильтр по подтверждению админом:
	// "yes" — только подтверждённые, "no" — только неподтверждённые.
	// undefined — без фильтра (показываем всех).
	verifiedFilter?: "yes" | "no";

	// Фильтр по роли пользователя.
	// undefined — без фильтра (любая роль).
	roleFilter?: "user" | "admin" | "super";

	// Фильтр по дате создания.
	// createdFrom / createdTo ожидают строку в формате "YYYY-MM-DD"
	// (такую строку даёт <input type="date" />).
	createdFrom?: string;
	createdTo?: string;

	// Поисковая строка по нескольким полям:
	// ID, Почта, ФИО, Телефон, Город.
	search?: string;

	// Отдельные фильтры по колонкам для шапки таблицы.
	// ID (publicId в базе).
	idFilter?: string;
	// Почта.
	emailFilter?: string;
	// ФИО (ищем по name / surname / patronymic).
	fioFilter?: string;
	// Телефон (ищем по phone1 и phone2).
	phoneFilter?: string;
	// Город.
	cityFilter?: string;
};

export type GetUsersForAdminResult = {
	users: IUser[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

// Получить пользователей для админского списка с учётом пагинации и сортировки.
// Важно для тысяч пользователей: мы не тянем всех сразу, а берём только одну страницу.
export const getUsersForAdmin = async (params: GetUsersForAdminParams = {}): Promise<GetUsersForAdminResult> => {
	try {
		await connectDB();

		const page = params.page && params.page > 0 ? params.page : 1;
		const limit = params.limit && params.limit > 0 ? params.limit : 50;

		const allowedSortField: GetUsersForAdminParams["sortField"][] = ["createdAt", "email", "name", "city", "role"];
		const sortField: GetUsersForAdminParams["sortField"] = allowedSortField.includes(params.sortField || "createdAt") ? params.sortField || "createdAt" : "createdAt";

		const sortDirection: GetUsersForAdminParams["sortDirection"] = params.sortDirection === "asc" ? "asc" : "desc";

		const skip = (page - 1) * limit;
		const sort: Record<string, 1 | -1> = {
			[sortField]: sortDirection === "asc" ? 1 : -1,
		};

		// -----------------------------
		// 1. Собираем объект фильтрации.
		// -----------------------------
		const mongoFilter: Record<string, unknown> = {};

		// Фильтр по подтверждению админом.
		if (params.verifiedFilter === "yes") {
			mongoFilter.isVerifiedByAdmin = true;
		} else if (params.verifiedFilter === "no") {
			mongoFilter.isVerifiedByAdmin = false;
		}

		// Фильтр по роли пользователя.
		if (params.roleFilter === "user" || params.roleFilter === "admin" || params.roleFilter === "super") {
			mongoFilter.role = params.roleFilter;
		}

		// Фильтр по дате создания.
		if (params.createdFrom || params.createdTo) {
			const createdAtFilter: { $gte?: Date; $lte?: Date } = {};

			if (params.createdFrom) {
				// Начало дня "createdFrom".
				createdAtFilter.$gte = new Date(params.createdFrom);
			}

			if (params.createdTo) {
				// Конец дня "createdTo": берём дату + 1 день как верхнюю границу.
				const toDate = new Date(params.createdTo);
				toDate.setDate(toDate.getDate() + 1);
				createdAtFilter.$lte = toDate;
			}

			mongoFilter.createdAt = createdAtFilter;
		}

		// -----------------------------
		// 2. Текстовые фильтры по нескольким колонкам.
		//    Здесь мы собираем массив условий и объединяем их через $and,
		//    чтобы можно было одновременно фильтровать по нескольким полям.
		// -----------------------------
		const andFilters: Record<string, unknown>[] = [];

		// Универсальный помощник: из строки делаем "безопасный" RegExp.
		const makeRegex = (value?: string) => {
			if (!value || value.trim().length === 0) return null;
			const trimmed = value.trim();
			const escapeRegExp = (source: string) => source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const safeValue = escapeRegExp(trimmed);
			return new RegExp(safeValue, "i");
		};

		// Старый общий поисковый фильтр по всем полям.
		const globalSearchRegex = makeRegex(params.search);
		if (globalSearchRegex) {
			andFilters.push({
				$or: [
					{ publicId: globalSearchRegex },
					{ email: globalSearchRegex },
					{ name: globalSearchRegex },
					{ surname: globalSearchRegex },
					{ patronymic: globalSearchRegex },
					{ phone1: globalSearchRegex },
					{ phone2: globalSearchRegex },
					{ city: globalSearchRegex },
				],
			});
		}

		// Фильтр по ID (publicId).
		const idRegex = makeRegex(params.idFilter);
		if (idRegex) {
			mongoFilter.publicId = idRegex;
		}

		// Фильтр по почте.
		const emailRegex = makeRegex(params.emailFilter);
		if (emailRegex) {
			mongoFilter.email = emailRegex;
		}

		// Фильтр по телефону (phone1 / phone2).
		const phoneRegex = makeRegex(params.phoneFilter);
		if (phoneRegex) {
			andFilters.push({
				$or: [{ phone1: phoneRegex }, { phone2: phoneRegex }],
			});
		}

		// Фильтр по городу.
		const cityRegex = makeRegex(params.cityFilter);
		if (cityRegex) {
			mongoFilter.city = cityRegex;
		}

		// Фильтр по ФИО (name / surname / patronymic).
		const fioRegex = makeRegex(params.fioFilter);
		if (fioRegex) {
			andFilters.push({
				$or: [{ name: fioRegex }, { surname: fioRegex }, { patronymic: fioRegex }],
			});
		}

		// Если накопились сложные текстовые фильтры — добавляем их через $and.
		if (andFilters.length > 0) {
			mongoFilter.$and = andFilters;
		}

		// Берём пользователей постранично и одновременно считаем общее количество
		// уже с учётом фильтров.
		const [usersDocs, total] = await Promise.all([UserModel.find(mongoFilter).sort(sort).skip(skip).limit(limit), UserModel.countDocuments(mongoFilter)]);

		// Ленивая миграция: для уже существующих пользователей, у которых ещё нет publicId,
		// генерируем его и сохраняем. Так при первом заходе в админку ID сразу станут "человечными".
		for (const doc of usersDocs) {
			if (!doc.publicId) {
				// eslint-disable-next-line no-await-in-loop
				const publicId = await generateUserPublicId();
				doc.publicId = publicId;
				// eslint-disable-next-line no-await-in-loop
				await doc.save();
			}
		}

		const users = normalizeDbRes<IUser[]>(usersDocs);
		const totalPages = Math.max(1, Math.ceil(total / limit));

		return { users, total, page, limit, totalPages };
	} catch (error) {
		// В случае ошибки возвращаем "пустой" результат, чтобы страница не падала.
		return { users: [], total: 0, page: 1, limit: 50, totalPages: 1 };
	}
};

// Получить одного пользователя для админской страницы редактирования.
// Поддерживаем как ObjectId, так и человекочитаемый publicId (формат UXXXXXXXXXX),
// чтобы старые ссылки не сломались и новые "красивые" ID тоже работали.
export const getUserByIdForAdmin = async ({ id }: { id: string }): Promise<IUser | null> => {
	try {
		await connectDB();

		// Небольшая проверка: похоже ли значение на Mongo ObjectId.
		// Если строка не 24 символа из 0-9a-f — считаем, что это НЕ ObjectId,
		// и не пытаемся искать по _id, чтобы не ловить CastError от Mongoose.
		const isLikelyObjectId = /^[0-9a-fA-F]{24}$/.test(id);

		// Если пришёл "нормальный" ObjectId — ищем и по _id, и по publicId.
		// Если пришёл человекочитаемый ID (UXXXXXXXXXX) — ищем только по publicId.
		const query = isLikelyObjectId ? { $or: [{ _id: id }, { publicId: id }] } : { publicId: id };

		const user = await UserModel.findOne(query);

		// Ленивая миграция: если у пользователя ещё нет publicId, генерируем и сохраняем.
		if (user && !user.publicId) {
			user.publicId = await generateUserPublicId();
			await user.save();
		}

		return normalizeDbRes<IUser>(user);
	} catch (error) {
		return null;
	}
};
