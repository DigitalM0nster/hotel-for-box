import { auth } from "@/auth";
import BranchForm from "@/components/forms/branchForm";
import styles from "../../AdminDashboard.module.scss";

export default async function AdminBranchesNewPage() {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Создание отделения</div>
					<div>Доступ к созданию отделений есть только у администратора.</div>
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Создание отделения</div>
				<BranchForm branch={null} redirectTo="/admin/branches" />
			</section>
		</div>
	);
}
