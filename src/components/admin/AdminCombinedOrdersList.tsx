"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/admin/AdminTable.module.scss";
import { IOrder, StatusEnToRu } from "@/mongodb/models/orderModel";
import { CombinedOrderGroup } from "@/libs/services/orderService";

type AdminCombinedOrdersListProps = {
	groups: CombinedOrderGroup[];
};

// Таблица объединенных заказов для администратора.
export default function AdminCombinedOrdersList({ groups }: AdminCombinedOrdersListProps) {
	const router = useRouter();
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	// Переключение раскрытия/сворачивания группы
	const toggleGroup = (groupId: string) => {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) {
				next.delete(groupId);
			} else {
				next.add(groupId);
			}
			return next;
		});
	};

	// Обработчик разделения группы
	const handleSplitGroup = async (groupId: string, orderIds: string[]) => {
		if (!confirm(`Вы уверены, что хотите разделить эту группу? Группа будет удалена, и заказы станут независимыми.`)) {
			return;
		}

		try {
			const res = await fetch("/api/orders/split", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderIds }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Ошибка разделения");
			alert("Группа разделена");
			router.refresh();
		} catch (error: any) {
			alert(error.message || "Ошибка разделения группы");
		}
	};

	// Вычисляем человекочитаемый статус оплаты
	const getPaymentStatusLabel = (group: CombinedOrderGroup) => {
		if (group.totalCost === 0 && group.totalPaid === 0) return "—";
		if (group.totalPaid === 0) return "Не оплачен";
		if (group.totalPaid < group.totalCost) return "Частично оплачен";
		if (group.totalPaid >= group.totalCost) return "Полностью оплачен";
		return "Оплата есть";
	};

	if (groups.length === 0) {
		return (
			<div className={styles.adminTableWrapper}>
				<div className={styles.adminFiltersPanel}>
					<div className={styles.adminFiltersPanelHeader}>
						<div className={styles.adminFiltersPanelTitle}>Активные фильтры</div>
					</div>
				</div>
				<table className={styles.adminTable}>
					<thead>
						<tr>
							<th>
								<div className={styles.adminTableHeaderCell}>
									<span>ID группы</span>
								</div>
							</th>
							<th>
								<div className={styles.adminTableHeaderCell}>
									<span>Количество заказов</span>
								</div>
							</th>
							<th>
								<div className={styles.adminTableHeaderCell}>
									<span>Общий вес, кг</span>
								</div>
							</th>
							<th>
								<div className={styles.adminTableHeaderCell}>
									<span>Общая стоимость, ₽</span>
								</div>
							</th>
							<th>
								<div className={styles.adminTableHeaderCell}>
									<span>Оплачено, ₽</span>
								</div>
							</th>
							<th>
								<div className={styles.adminTableHeaderCell}>
									<span>Статус оплаты</span>
								</div>
							</th>
							<th>
								<div className={styles.adminTableHeaderCell}>
									<span>Дата создания</span>
								</div>
							</th>
							<th>Действия</th>
						</tr>
						<tr>
							<th colSpan={8}></th>
						</tr>
					</thead>
					<tbody>
						<tr className={styles.adminTableRow}>
							<td colSpan={8}>Заказы отсутствуют</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}

	return (
		<div className={styles.adminTableWrapper}>
			<div className={styles.adminFiltersPanel}>
				<div className={styles.adminFiltersPanelHeader}>
					<div className={styles.adminFiltersPanelTitle}>Активные фильтры</div>
					<div className={styles.adminFiltersList}>
						<span className={styles.adminSortChip}>Всего групп: {groups.length}</span>
					</div>
				</div>
			</div>

			<table className={styles.adminTable}>
				<thead>
					<tr>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>ID группы</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Количество заказов</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Общий вес, кг</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Общая стоимость, ₽</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Оплачено, ₽</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Статус оплаты</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Дата создания</span>
							</div>
						</th>
						<th>Действия</th>
					</tr>
					<tr>
						<th colSpan={8}></th>
					</tr>
				</thead>
				<tbody>
					{groups.map((group) => {
						const isExpanded = expandedGroups.has(group.groupId);
						// Показываем groupId в формате №000123 (как для заказов)
						const displayGroupId = group.groupId ? `№${group.groupId}` : "—";

						return (
							<Fragment key={group.groupId}>
								{/* Основная строка группы */}
								<tr className={styles.adminTableRow}>
									<td>
										<button type="button" onClick={() => toggleGroup(group.groupId)} className={styles.adminTableActionButton}>
											{isExpanded ? "▼" : "▶"} {displayGroupId}
										</button>
									</td>
									<td>{group.ordersCount}</td>
									<td>{group.totalWeight > 0 ? group.totalWeight.toFixed(2) : "—"}</td>
									<td>{group.totalCost > 0 ? group.totalCost.toFixed(2) : "—"}</td>
									<td>{group.totalPaid > 0 ? group.totalPaid.toFixed(2) : "—"}</td>
									<td>{getPaymentStatusLabel(group)}</td>
									<td>{group.createdAt ? new Date(group.createdAt).toLocaleDateString() : "—"}</td>
									<td>
										<div className={styles.adminTableActionsRow}>
											<button
												type="button"
												className={`${styles.adminTableActionButton} ${styles.adminTableActionDanger}`}
												onClick={() => handleSplitGroup(group.groupId, group.orders.map((o) => o._id || "").filter(Boolean))}
											>
												Разделить
											</button>
										</div>
									</td>
								</tr>

								{/* Развернутые заказы в группе */}
								{isExpanded && (
									<tr>
										<td colSpan={8} className={styles.combinedOrdersNestedCell}>
											<div className={styles.combinedOrdersNestedHeader}>Заказы в группе</div>
											<div className={styles.combinedOrdersNestedTableWrapper}>
												<table className={styles.adminTable}>
													<thead>
														<tr>
															<th>
																<div className={styles.adminTableHeaderCell}>
																	<span>Номер заказа</span>
																</div>
															</th>
															<th>
																<div className={styles.adminTableHeaderCell}>
																	<span>Трек-номер</span>
																</div>
															</th>
															<th>
																<div className={styles.adminTableHeaderCell}>
																	<span>Описание</span>
																</div>
															</th>
															<th>
																<div className={styles.adminTableHeaderCell}>
																	<span>Вес, кг</span>
																</div>
															</th>
															<th>
																<div className={styles.adminTableHeaderCell}>
																	<span>Стоимость, ₽</span>
																</div>
															</th>
															<th>
																<div className={styles.adminTableHeaderCell}>
																	<span>Статус</span>
																</div>
															</th>
															<th>Действия</th>
														</tr>
														<tr>
															<th colSpan={7}></th>
														</tr>
													</thead>
													<tbody>
														{group.orders.map((order) => (
															<tr key={order._id} className={styles.adminTableRow}>
																<td>{order.orderId ? `№${order.orderId}` : "—"}</td>
																<td>{order.track || "—"}</td>
																<td>{order.description || "—"}</td>
																<td>{typeof order.weight === "number" ? order.weight.toFixed(2) : "—"}</td>
																<td>{typeof order.order_coast === "number" ? order.order_coast.toFixed(2) : "—"}</td>
																<td>{StatusEnToRu[order.status]}</td>
																<td>
																	<div className={styles.adminTableActionsRow}>
																		<Link
																			href={`/admin/orders/${
																				order.orderId && String(order.orderId).trim().length > 0 ? String(order.orderId) : order._id
																			}`}
																			className={styles.adminTableActionButton}
																		>
																			Открыть
																		</Link>
																	</div>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</td>
									</tr>
								)}
							</Fragment>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
