import styles from "./ScoreHistoryPage.module.scss";

type ScoreStatus = "active" | "pending" | "cancelled";

type ScoreHistoryRow = {
	id: string;
	invoiceAmount: number;
	pointsComing: number;
	pointsLeave: number;
	status: ScoreStatus;
	createdAt: string;
};

// TODO: заменить на реальные данные из бэкенда
const mockRows: ScoreHistoryRow[] = [];

export default function ScoreHistoryPage() {
	const rows = mockRows;

	return (
		<div className={styles.pointsHistoryWrapper}>
			<div className={styles.pointsHistoryTitle}>История баллов</div>

			<div className={styles.tableCard}>
				<table className={styles.table}>
					<thead className={styles.thead}>
						<tr>
							<th className={styles.th}>№ счёта</th>
							<th className={styles.th}>Сумма счёта</th>
							<th className={styles.th}>Баллов начислено</th>
							<th className={styles.th}>Баллов списано</th>
							<th className={styles.th}>Статус</th>
							<th className={styles.th}>Создано</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td className={styles.emptyRow} colSpan={6}>
									По вашим баллам пока нет операций.
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr key={row.id}>
									<td className={`${styles.td} ${styles.invoiceCell}`}>{row.id}</td>
									<td className={`${styles.td} ${styles.amountCell}`}>${row.invoiceAmount.toFixed(2)}</td>
									<td className={`${styles.td} ${styles.pointsPositive}`}>{row.pointsComing}</td>
									<td className={`${styles.td} ${styles.pointsNegative}`}>{row.pointsLeave || "-"}</td>
									<td className={styles.td}>
										<span
											className={`${styles.statusPill} ${
												row.status === "active" ? styles.statusActive : row.status === "pending" ? styles.statusPending : styles.statusCancelled
											}`}
										>
											{row.status === "active" && "Активен"}
											{row.status === "pending" && "Ожидает"}
											{row.status === "cancelled" && "Отменён"}
										</span>
									</td>
									<td className={styles.td}>{row.createdAt}</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				<div className={styles.paginationRow}>
					<button className={`${styles.pageButton} ${styles.pageButtonDisabled}`} aria-label="Previous page">
						<span className={styles.pageButtonIcon}>{"<"}</span>
					</button>
					<button className={`${styles.pageButton} ${styles.pageButtonActive}`}>1</button>
					<button className={`${styles.pageButton} ${styles.pageButtonDisabled}`} aria-label="Next page">
						<span className={styles.pageButtonIcon}>{">"}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
