import { auth } from "@/auth";
import styles from "../../AdminDashboard.module.scss";
import RegisterForm from "@/components/forms/singUpForm";

// Страница создания пользователя из админки.
// Здесь админ/суперадмин может создать нового пользователя, не попадая на общую страницу регистрации.
export default async function AdminCreateUserPage() {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Создание пользователя</div>
					<div>Создавать пользователей могут только администраторы.</div>
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Создание пользователя</div>
				{/* 
					Передаём в форму:
					- роль текущего администратора (admin/super), чтобы показать нужные поля роли/подтверждения;
					- адрес, куда вернуть после успешного создания — обратно в список пользователей.
				*/}
				<RegisterForm currentAdminRole={session.user.role} redirectToAfterSuccess="/admin/users" />
			</section>
		</div>
	);
}
