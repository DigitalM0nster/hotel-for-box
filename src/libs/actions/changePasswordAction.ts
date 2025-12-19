"use server";

import { INPUT_VALIDATE } from "@/data/constants/inputValidate";
import { changePassword } from "@/libs/services/usersService";
import { IActionResult } from "@/types/types";

export type ChangePasswordState = IActionResult | { type?: undefined; message?: string };

// Серверный экшен: достаём поля формы, валидируем и обновляем пароль
export async function changePasswordAction(_prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
	const oldPassword = String(formData.get("password_old") || "");
	const newPassword = String(formData.get("password") || "");

	if (!oldPassword || !newPassword) {
		return { type: "warning", message: "Заполните оба поля." };
	}

	if (!INPUT_VALIDATE.password.reg.test(newPassword)) {
		return { type: "warning", message: INPUT_VALIDATE.password.defErrorMsg };
	}

	return changePassword({ oldPassword, newPassword });
}
