import { ReactNode } from "react";
import { redirect } from "next/navigation";

import "@/styles/globals.scss";
import styles from "./AdminDashboard.module.scss";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { auth } from "@/auth";

// Layout админки.
// Здесь мы сразу на сервере проверяем роль пользователя
// и не даём зайти в /admin и глубже, если это не admin/super.
export default async function AdminLayout({ children }: { children: ReactNode }) {
	// 1) Получаем сессию пользователя через NextAuth.
	//    Это запрос к бэкенду/БД, который достаёт данные текущего пользователя.
	const session = await auth();

	// 2) Берём роль пользователя из сессии, если нет — считаем, что это обычный "user".
	const role = session?.user.role ?? "user";

	// 3) Если роль не admin и не super — отправляем пользователя на главную страницу.
	//    redirect в Next.js на сервере не просто "возвращает JSX",
	//    а мгновенно прерывает выполнение и отвечает редиректом браузеру.
	if (role !== "admin" && role !== "super") {
		redirect("/"); // сюда попадут все, кому нельзя в админку
	}

	// 4) Если роль подходит — рендерим админский layout и всё, что внутри /admin.
	return (
		<div className={styles.adminLayoutWrapper}>
			<AdminSidebar />
			<main className={styles.content}>{children}</main>
		</div>
	);
}
