import { auth } from "@/auth";
import styles from "../../AdminDashboard.module.scss";
import { getUserByIdForAdmin } from "@/libs/services/usersService";
import UpdateUserForm from "@/components/forms/updateUserForm";

// Страница редактирования пользователя в админке.
// Это серверный компонент: он получает пользователя с бэкенда и передаёт его в форму.
export default async function AdminUserEditPage({ params }: { params: { id: string } }) {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Редактирование пользователя</div>
					<div>Доступ к редактированию пользователей есть только у администратора.</div>
				</section>
			</div>
		);
	}

	const user = await getUserByIdForAdmin({ id: params.id });

	if (!user) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Редактирование пользователя</div>
					<div>Пользователь не найден.</div>
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Редактирование пользователя</div>
				{/* В админке редактируем чужие данные: роль/подтверждение регулируем, но пароль не трогаем. */}
				<UpdateUserForm user={user} currentAdminRole={session.user.role} showChangePasswordLink={false} />
			</section>
		</div>
	);
}
