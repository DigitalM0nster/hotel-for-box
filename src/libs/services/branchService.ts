"use server";

import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { connectDB } from "@/mongodb/connect";
import { BranchModel, IBranch } from "@/mongodb/models/branchModel";
import { IActionResult } from "@/types/types";

// Генерация человеко-читаемого ID отделения, например "M39640".
// Это делается на бэкенде, чтобы админ не придумывал ID руками.
const generateBranchId = (): string => {
	const randomPart = Math.floor(10000 + Math.random() * 90000); // пятизначное число
	return `M${randomPart}`;
};

// При создании branchId не обязателен: если его не передали, мы создадим его сами.
export const createBranch = async (branch: Omit<IBranch, "branchId"> & { branchId?: string }): Promise<IActionResult> => {
	try {
		await connectDB();
		const newBranch = new BranchModel();

		// Собираем данные для сохранения: если branchId не пришёл — генерируем.
		Object.assign(newBranch, {
			...branch,
			branchId: branch.branchId && branch.branchId.trim().length > 0 ? branch.branchId : generateBranchId(),
		});

		await newBranch.save();
		return { type: "success", message: "Отдел успешно добавлен" };
	} catch (error) {
		if (error instanceof Error) {
			return { type: "warning", message: error.message };
		}
		return { type: "error", message: "Ошибка операции, повторите позже." };
	}
};
export const updateBranch = async ({ branch, updatedId }: { branch: IBranch; updatedId: string }): Promise<IActionResult> => {
	try {
		await connectDB();

		// Используем findByIdAndUpdate для более надежного обновления
		const updatedBranch = await BranchModel.findByIdAndUpdate(
			updatedId,
			{
				$set: {
					title: branch.title,
					country: branch.country, // Явно устанавливаем страну
					city: branch.city,
					adress: branch.adress,
					zip_code: branch.zip_code,
					workTime: {
						from: branch.workTime.from,
						to: branch.workTime.to,
					},
					phone1: branch.phone1,
					...(branch.phone2 !== undefined && { phone2: branch.phone2 || null }),
					...(branch.user_message !== undefined && { user_message: branch.user_message || null }),
					...(branch.admin_description !== undefined && { admin_description: branch.admin_description || null }),
				},
			},
			{ new: true, runValidators: true } // new: true возвращает обновленный документ, runValidators запускает валидацию схемы
		);

		if (!updatedBranch) return { type: "error", message: "Адрес не найден" };

		return { type: "success", message: "Отдел успешно обновлен" };
	} catch (error) {
		if (error instanceof Error) {
			return { type: "warning", message: error.message };
		}
		return { type: "error", message: "Ошибка операции, повторите позже." };
	}
};

export const getBranchesAll = async (): Promise<IBranch[]> => {
	try {
		await connectDB();
		const branches = await BranchModel.find();
		return normalizeDbRes<IBranch[]>(branches);
	} catch (error) {
		return [];
	}
};

export const getBranchById = async ({ id }: { id: string }): Promise<IBranch | null> => {
	try {
		await connectDB();
		const branch = await BranchModel.findById(id);

		return normalizeDbRes<IBranch>(branch);
	} catch (error) {
		return null;
	}
};
