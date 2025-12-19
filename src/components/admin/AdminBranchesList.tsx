"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/lists/OrdersList/OrdersList.module.scss";
import { IBranch } from "@/mongodb/models/branchModel";

type AdminBranchesListProps = {
	branches: IBranch[];
};

export default function AdminBranchesList({ branches }: AdminBranchesListProps) {
	// Локальное состояние списка, чтобы сразу убирать карточку после удаления.
	const [list, setList] = useState<IBranch[]>(branches);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const router = useRouter();

	// Если пропы поменялись (например, после серверного обновления), синхронизируем список.
	useEffect(() => {
		setList(branches);
	}, [branches]);

	if (!list.length) {
		return null;
	}

	const handleOpenBranch = (branchId?: string) => {
		if (!branchId) return;
		router.push(`/admin/branches/${branchId}`);
	};

	const handleDeleteBranch = async (event: React.MouseEvent, branchId?: string) => {
		event.stopPropagation();
		if (!branchId) return;

		const confirmed = window.confirm("Вы действительно хотите удалить это отделение?");
		if (!confirmed) return;

		try {
			setDeletingId(branchId);
			const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE" });
			const data = await res.json();

			if (!res.ok) {
				alert(data?.message || "Не удалось удалить отделение");
				return;
			}

			// Убираем отделение из списка на клиенте.
			setList((prev) => prev.filter((branch) => branch._id !== branchId));
		} catch (error) {
			alert("Ошибка удаления отделения, попробуйте ещё раз");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className={styles.listWrapper}>
			{list.map((branch) => (
				<div key={branch._id} className={styles.orderCard} onClick={() => handleOpenBranch(branch._id)}>
					<div className={styles.orderCardTop}>
						<div className={styles.orderIdRow}>
							<span className={styles.orderIdLabel}>ID для склада:</span>
							<span className={styles.orderIdValue}>#{branch.branchId}</span>
						</div>
						<div className={styles.orderActionsRow}>
							<Link href={`/admin/branches/${branch._id}`} className={styles.orderActionButton}>
								Редактировать
							</Link>
							<button
								type="button"
								className={`${styles.orderActionButton} ${styles.orderActionDanger}`}
								onClick={(event) => handleDeleteBranch(event, branch._id)}
								disabled={deletingId === branch._id}
							>
								{deletingId === branch._id ? "Удаляем..." : "Удалить"}
							</button>
						</div>
					</div>

					<div className={styles.orderCardBody}>
						<div className={styles.orderContent}>
							<div className={styles.orderHeader}>
								<div className={styles.orderDescription}>
									{branch.city}
									{branch.title ? `, ${branch.title}` : ""}
								</div>
							</div>

							<div className={styles.orderMetaRow}>
								<div className={styles.orderShop}>{branch.adress}</div>
								<div className={styles.orderTrack}>{branch.zip_code}</div>
							</div>
							<div className={styles.orderFooter}>
								<div className={styles.orderStatusRow}>
									<div className={styles.orderStatusLabel}>Телефон</div>
									<div className={styles.orderStatusValue}>{branch.phone1}</div>
								</div>
								<div className={styles.orderDate}>
									{branch.workTime?.from && branch.workTime?.to ? `${branch.workTime.from} - ${branch.workTime.to}` : "Время работы не указано"}
								</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
