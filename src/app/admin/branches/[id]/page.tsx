import { auth } from "@/auth";
import BranchForm from "@/components/forms/branchForm";
import styles from "../../AdminDashboard.module.scss";
import { getBranchById } from "@/libs/services/branchService";

// Страница редактирования отделения в админке.
// Это серверный компонент: он получает отделение с бэкенда и передаёт его в форму.
export default async function AdminBranchEditPage({ params }: { params: { id: string } }) {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Редактирование отделения</div>
					<div>Доступ к редактированию отделений есть только у администратора.</div>
				</section>
			</div>
		);
	}

	const branch = await getBranchById({ id: params.id });

	if (!branch) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Редактирование отделения</div>
					<div>Отделение не найдено.</div>
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Редактирование отделения</div>
				<BranchForm branch={branch} redirectTo="/admin/branches" />
			</section>
		</div>
	);
}
