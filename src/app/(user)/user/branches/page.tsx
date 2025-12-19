import { auth } from "@/auth";

import { getBranchesAll } from "@/libs/services/branchService";
import BranchesTabs from "@/components/branches/BranchesTabs";
import styles from "./UserBranchesPage.module.scss";

// Страница отделений в личном кабинете пользователя.
// Отображает отделы с вкладками "Россия" и "Монголия", фильтруя их по стране.
export default async function BranchesPage() {
	const session = await auth();
	// Получаем все отделы из базы данных
	const branches = await getBranchesAll();

	return (
		<div className={styles.branchesPageContainer}>
			<section className={styles.branchesPageHeaderSection}>
				<div className={styles.branchesPageHeaderContent}>
					<div className={styles.branchesPageTitle + " h3"}>Наши отделения</div>
				</div>
			</section>

			{/* Компонент с вкладками для отображения отделов по странам */}
			<BranchesTabs branches={branches} />
		</div>
	);
}
