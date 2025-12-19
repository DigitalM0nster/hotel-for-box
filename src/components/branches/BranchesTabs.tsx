"use client";

import { useState, useMemo } from "react";
import { TimerIco, RUSIco } from "@/icons/icons";
import { IBranch } from "@/mongodb/models/branchModel";
import styles from "./BranchesTabs.module.scss";

type BranchesTabsProps = {
	branches: IBranch[];
};

// Компонент с вкладками для отображения отделений по странам (Россия и Монголия)
export default function BranchesTabs({ branches }: BranchesTabsProps) {
	// Активная вкладка: "Россия" или "Монголия"
	const [activeTab, setActiveTab] = useState<"Россия" | "Монголия">("Россия");

	// Фильтруем отделы по стране для активной вкладки
	const filteredBranches = useMemo(() => {
		return branches.filter((branch) => branch.country === activeTab);
	}, [branches, activeTab]);

	// Подсчитываем количество отделов в каждой стране
	const russiaCount = useMemo(() => branches.filter((b) => b.country === "Россия").length, [branches]);
	const mongoliaCount = useMemo(() => branches.filter((b) => b.country === "Монголия").length, [branches]);

	return (
		<div className={styles.branchesTabsContainer}>
			{/* Вкладки для переключения между странами */}
			<div className={styles.tabsWrapper}>
				<button
					type="button"
					className={`${styles.tabButton} ${activeTab === "Россия" ? styles.tabButtonActive : styles.tabButtonInactive}`}
					onClick={() => setActiveTab("Россия")}
				>
					<RUSIco />
					<span>Россия {russiaCount > 0 && `(${russiaCount})`}</span>
				</button>
				<button
					type="button"
					className={`${styles.tabButton} ${activeTab === "Монголия" ? styles.tabButtonActive : styles.tabButtonInactive}`}
					onClick={() => setActiveTab("Монголия")}
				>
					<span>Монголия {mongoliaCount > 0 && `(${mongoliaCount})`}</span>
				</button>
			</div>

			{/* Список отделов для активной вкладки */}
			{filteredBranches.length === 0 ? (
				<div className={styles.emptyState}>Нет отделений для выбранной страны</div>
			) : (
				<div className={styles.branchesListColumns}>
					{filteredBranches.map(({ adress, city, branchId, phone1, title, workTime, zip_code, _id }) => (
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
			)}
		</div>
	);
}
