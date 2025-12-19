import ChangePasswordForm from "@/components/forms/changePasswordForm";

export default function UserChangePasswordPage() {
	return (
		<div className="changePasswordPageWrapper" style={{ flexDirection: "column", gap: "16px" }}>
			<div className="h3">Смена пароля</div>
			<ChangePasswordForm />
		</div>
	);
}
