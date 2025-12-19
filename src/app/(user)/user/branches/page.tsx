import { auth } from "@/auth";

import { TimerIco, RUSIco } from "@/icons/icons";
import { getBranchesAll } from "@/libs/services/branchService";
import styles from "./UserBranchesPage.module.scss";

export default async function BranchesPage() {
	const session = await auth();
	const branches = await getBranchesAll();

	// В профиле пользователя показываем только статичный список отделений,
	// без перехода в режим просмотра/редактирования отделения.
	// Поэтому здесь всегда обычные div-карточки без ссылок.

	return (
		<div className={styles.branchesPageContainer}>
			<section className={styles.branchesPageHeaderSection}>
				<div className={styles.branchesPageHeaderContent}>
					<div className={styles.branchesPageTitle + " h3"}>Наши отделения</div>
					<div className={styles.branchesPageCountryTagWrapper}>
						<div className={styles.countryTag + " tag"}>
							<RUSIco />
							<div>Россия</div>
						</div>
					</div>
				</div>
			</section>

			<div className={styles.branchesListColumns}>
				{branches.map(({ adress, city, branchId, phone1, title, workTime, zip_code, _id }) => (
					<div key={_id} className={styles.branchCard + " box"}>
						<div className={styles.branchCardHeader}>
							<div className={styles.branchHeaderRight}>
								<TimerIco />
								<div className={styles.workTimeTag + " tag"}>{`${workTime.from} - ${workTime.to}`}</div>
							</div>
							<div className={styles.branchTitle + " h4-accent"}>{title}</div>
						</div>

						<div className={styles.branchCardInfo}>
							<div className={styles.branchInfoRow}>
								<div className={styles.branchInfoLabel + " body-3"}>ID для склада</div>
								<div className={styles.branchInfoValue + " body-3"}>{branchId}</div>
							</div>
							<div className={styles.branchInfoRow}>
								<div className={styles.branchInfoLabel + " body-3"}>Адрес:</div>
								<div className={styles.branchInfoValue + " body-3"}>{adress}</div>
							</div>
							<div className={styles.branchInfoRow}>
								<div className={styles.branchInfoLabel + " body-3"}>Город:</div>
								<div className={styles.branchInfoValue + " body-3"}>{city}</div>
							</div>
							<div className={styles.branchInfoRow}>
								<div className={styles.branchInfoLabel + " body-3"}>Индекс:</div>
								<div className={styles.branchInfoValue + " body-3"}>{zip_code}</div>
							</div>
							<div className={styles.branchInfoRow}>
								<div className={styles.branchInfoLabel + " body-3"}>Телефон:</div>
								<div className={styles.branchInfoValue + " body-3"}>{phone1}</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
