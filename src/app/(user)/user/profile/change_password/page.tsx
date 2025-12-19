import { redirect } from "next/navigation";

export default function ChangePasswordProfileLegacyPage() {
	// старый путь профиля ведём на основной /user/change_password
	redirect("/user/change_password");
}
