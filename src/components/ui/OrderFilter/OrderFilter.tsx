"use client";

import { CloseIco, ParamsIco } from "@/icons/icons";
import { useState } from "react";
import styles from "./OrderFilter.module.scss";

export default function OrderFilter() {
	const [isShowFilterMenu, setIsShowFilterMenu] = useState(false);
	const filterMenuShowToggle = () => setIsShowFilterMenu((state) => !state);
	return (
		<div className={styles.filterWrapper}>
			<input type="text" placeholder="Поиск: отслеживание, id, название" className={styles.searchInput} />
			<div className={`${styles.paramsButton} ${isShowFilterMenu ? styles.paramsButtonActive : ""}`} onClick={filterMenuShowToggle}>
				<ParamsIco />
			</div>

			{/* ФИЛЬТРЫ МЕНЮ */}
			{isShowFilterMenu && (
				<div className={styles.filtersMenu}>
					<div className={styles.filtersHeader} onClick={filterMenuShowToggle}>
						<div className={styles.filtersTitle}>Фильтры</div>
						<CloseIco className={styles.closeIcon} />
					</div>
					<div className={styles.fieldGroup}>
						<div className={styles.fieldLabel}>Название товара</div>
						<input type="text" className={styles.fieldInput} placeholder="Название товара" />
					</div>
					<div className={styles.fieldGroup}>
						<div className={styles.fieldLabel}>Номер отслеживания</div>
						<input type="text" className={styles.fieldInput} placeholder="Название товара" />
					</div>
					<div className={styles.fieldGroup}>
						<div className={styles.fieldLabel}>Номер отслеживания</div>
						<input type="text" className={styles.fieldInput} placeholder="Название товара" />
					</div>
					<div className={styles.fieldGroup}>
						<div className={styles.fieldLabel}>Номер отслеживания</div>
						<input type="text" className={styles.fieldInput} placeholder="Название товара" />
					</div>
					<div className={styles.fieldGroup}>
						<div className={styles.fieldLabel}>Номер отслеживания</div>
						<input type="text" className={styles.fieldInput} placeholder="Название товара" />
					</div>
					<div className={styles.actions}>
						<div className={`${styles.actionButton} ${styles.applyButton}`}>Применить</div>
						<div className={`${styles.actionButton} ${styles.resetButton}`}>Сбросить</div>
					</div>
				</div>
			)}
		</div>
	);
}
