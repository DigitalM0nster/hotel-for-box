"use client";

import { useActionState } from "react";

import { changePasswordAction, ChangePasswordState } from "@/libs/actions/changePasswordAction";
import { Input } from "@/components/ui/FormElements/Input";
import styles from "./styles.module.scss";

const initialState: ChangePasswordState = { type: undefined, message: "" };

export default function ChangePasswordForm() {
	const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

	const statusColor = state?.type === "success" ? "var(--color-f-accent)" : "var(--color-f-blue-950)";

	return (
		<form action={formAction} className={styles.changePasswordForm} style={{ flexDirection: "column", gap: "16px", maxWidth: "413px" }}>
			<Input name="password_old" title="Старый пароль" hideEye />
			<Input name="password" title="Новый пароль" hideEye />

			{state?.message ? (
				<div className="changePasswordStatus" style={{ color: statusColor, fontSize: "14px", lineHeight: "20px" }}>
					{state.message}
				</div>
			) : null}

			<button
				type="submit"
				disabled={pending}
				className="changePasswordSubmit"
				style={{
					border: "1px solid var(--color-f-accent)",
					padding: "11px 24px",
					borderRadius: "999px",
					textAlign: "center",
					cursor: "pointer",
					color: "var(--color-f-white-100)",
					background: "var(--color-f-accent)",
					alignSelf: "flex-start",
					opacity: pending ? 0.7 : 1,
				}}
			>
				{pending ? "Сохраняем..." : "Сохранить"}
			</button>
		</form>
	);
}
