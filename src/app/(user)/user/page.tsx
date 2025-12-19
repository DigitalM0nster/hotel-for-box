import { redirect } from "next/navigation";

export default function UserPage() {
	// при заходе на /user отправляем на профиль как точку входа
	redirect("/user/profile");
}
