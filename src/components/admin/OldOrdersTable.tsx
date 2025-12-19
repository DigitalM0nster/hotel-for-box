"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./OldOrdersTable.module.scss";
import { IOrder } from "@/mongodb/models/orderModel";

type OldOrdersTableProps = {
	initialOrders: IOrder[];
	initialPage: number;
	initialTotalPages: number;
};

// Компонент таблицы заказов старше двух недель для панели управления.
// Упрощенная версия AdminOrdersList, показывает только основные данные.
export default function OldOrdersTable({ initialOrders, initialPage, initialTotalPages }: OldOrdersTableProps) {
	const [orders, setOrders] = useState<IOrder[]>(initialOrders);
	const [page, setPage] = useState(initialPage);
	const [totalPages, setTotalPages] = useState(initialTotalPages);
	const [loading, setLoading] = useState(false);

	// Синхронизируем локальный список с пропами при изменении данных с сервера
	useEffect(() => {
		setOrders(initialOrders);
		setPage(initialPage);
		setTotalPages(initialTotalPages);
	}, [initialOrders, initialPage, initialTotalPages]);

	// Функция для загрузки данных с сервера
	const loadOrders = async (newPage: number) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/admin/dashboard/old-orders?page=${newPage}&limit=50`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки заказов");
			}
			const data = await response.json();
			setOrders(data.orders);
			setPage(data.page);
			setTotalPages(data.totalPages);
		} catch (error) {
			console.error("Ошибка загрузки заказов:", error);
		} finally {
			setLoading(false);
		}
	};

	// Обработчик изменения страницы
	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
			loadOrders(newPage);
		}
	};

	// Форматируем дату в формат YYYY/MM/DD
	const formatDate = (date: Date | string | undefined): string => {
		if (!date) return "-";
		const d = new Date(date);
		if (isNaN(d.getTime())) return "-";
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${year}/${month}/${day}`;
	};

	// Обработчик удаления заказа
	const handleDelete = async (orderId: string) => {
		if (!confirm("Вы уверены, что хотите удалить этот заказ?")) {
			return;
		}

		try {
			const response = await fetch(`/api/orders/${orderId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Ошибка удаления заказа");
			}

			// Удаляем заказ из списка
			setOrders((prev) => prev.filter((order) => order._id !== orderId));
		} catch (error) {
			console.error("Ошибка удаления заказа:", error);
			alert("Ошибка удаления заказа");
		}
	};

	return (
		<div className={styles.oldOrdersTableWrapper}>
			{loading && <div className={styles.loadingOverlay}>Загрузка...</div>}

			<table className={styles.oldOrdersTable}>
				<thead>
					<tr>
						<th>ID заказа</th>
						<th>Абонентский ящик</th>
						<th>Отделение</th>
						<th>Трек-номер</th>
						<th>Дата заказа</th>
						<th>Сайт заказа</th>
						<th>Действия</th>
					</tr>
				</thead>
				<tbody>
					{orders.length === 0 ? (
						<tr>
							<td colSpan={7} className={styles.emptyCell}>
								Нет заказов старше двух недель
							</td>
						</tr>
					) : (
						orders.map((order) => (
							<tr key={order._id}>
								{/* ID заказа */}
								<td>{order.orderId ? `#${order.orderId}` : order._id ? `#${String(order._id).slice(-6)}` : "-"}</td>

								{/* Абонентский ящик */}
								<td>{order.h4b_us_id ? `#${order.h4b_us_id}` : "-"}</td>

								{/* Отделение (склад) */}
								<td>{(order as IOrder & { branchTitle?: string }).branchTitle || "-"}</td>

								{/* Трек-номер */}
								<td>{order.track || "-"}</td>

								{/* Дата заказа */}
								<td>{formatDate(order.createdAt)}</td>

								{/* Сайт заказа */}
								<td>
									{order.shopUrl ? (
										<a href={order.shopUrl} target="_blank" rel="noopener noreferrer" className={styles.shopLink}>
											{order.shopUrl}
										</a>
									) : (
										"-"
									)}
								</td>

								{/* Действия */}
								<td>
									<div className={styles.actionsCell}>
										{/* Просмотр/Редактирование - используем orderId если есть, иначе _id */}
										<Link
											href={`/admin/orders/${order.orderId && String(order.orderId).trim().length > 0 ? String(order.orderId) : order._id}`}
											className={styles.actionButton}
											title="Просмотр"
										>
											👁
										</Link>

										{/* Удаление */}
										<button type="button" onClick={() => handleDelete(order.orderId || order._id || "")} className={styles.actionButton} title="Удалить">
											🗑
										</button>
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>

			{/* Пагинация */}
			{totalPages > 1 && (
				<div className={styles.pagination}>
					<button type="button" onClick={() => handlePageChange(1)} disabled={page === 1} className={styles.paginationButton}>
						«
					</button>
					<button type="button" onClick={() => handlePageChange(page - 1)} disabled={page === 1} className={styles.paginationButton}>
						‹
					</button>

					{/* Показываем номера страниц */}
					{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
						let pageNum: number;
						if (totalPages <= 5) {
							pageNum = i + 1;
						} else if (page <= 3) {
							pageNum = i + 1;
						} else if (page >= totalPages - 2) {
							pageNum = totalPages - 4 + i;
						} else {
							pageNum = page - 2 + i;
						}

						return (
							<button
								key={pageNum}
								type="button"
								onClick={() => handlePageChange(pageNum)}
								className={`${styles.paginationButton} ${page === pageNum ? styles.paginationButtonActive : ""}`}
							>
								{pageNum}
							</button>
						);
					})}

					{totalPages > 5 && page < totalPages - 2 && <span className={styles.paginationDots}>...</span>}

					{totalPages > 5 && (
						<button
							type="button"
							onClick={() => handlePageChange(totalPages)}
							className={`${styles.paginationButton} ${page === totalPages ? styles.paginationButtonActive : ""}`}
						>
							{totalPages}
						</button>
					)}

					<button type="button" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className={styles.paginationButton}>
						›
					</button>
					<button type="button" onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} className={styles.paginationButton}>
						»
					</button>
				</div>
			)}
		</div>
	);
}
