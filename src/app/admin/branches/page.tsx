import { auth } from "@/auth";
import styles from "../AdminDashboard.module.scss";
import { getBranchesAll } from "@/libs/services/branchService";
import Link from "next/link";
import AdminBranchesList from "@/components/admin/AdminBranchesList";

export default async function AdminBranchesPage() {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Отделения</div>
					<div>Доступ к разделу отделений есть только у администратора.</div>
				</section>
			</div>
		);
	}

	const branches = await getBranchesAll();

	return (
		<div className={`${styles.cardsColumn} ${styles.branches}`}>
			<section className={styles.card}>
				{/* Заголовок карточки отделений */}
				<div className={styles.cardTitle}>Отделения</div>

				{/* Список отделений или текст \"пока нет\" */}
				{branches.length === 0 ? <div className={styles.emptyText}>Отделений пока нет.</div> : <AdminBranchesList branches={branches} />}

				{/* Кнопка добавления отделения под списком */}
				<Link href="/admin/branches/new" className={styles.applyButton}>
					Добавить отделение
				</Link>
			</section>
		</div>
	);
}
