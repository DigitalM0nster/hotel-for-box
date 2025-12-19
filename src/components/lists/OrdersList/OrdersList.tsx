"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { progectPathes } from "@/config/pathes";
import { BoxBigIco, BoxSmallIco, PlusIco } from "@/icons/icons";
import { IOrder, StatusEnToRu } from "@/mongodb/models/orderModel";
import styles from "./OrdersList.module.scss";

export default function OrdersList({ orders }: { orders: IOrder[] }) {
	const router = useRouter();
	const [list, setList] = useState<IOrder[]>(orders);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	// Когда табы переключаются и в компонент приходят другие заказы,
	// синхронизируем локальный список с пропами.
	useEffect(() => {
		setList(orders);
	}, [orders]);

	if (!list.length)
		return (
			<div className={styles.emptyWrapper}>
				<div className={styles.emptyBox}>
					<BoxBigIco className={styles.emptyIcon} />
					<div className={styles.emptyTitle}>У вас нет ожидаемых входящих посылок</div>
					<Link href={progectPathes.ordersId.path + "new_order"} className={styles.createButton}>
						<span className={styles.createButtonText}>Создать заказ</span>
						<PlusIco className={styles.createButtonIcon} width={18} height={18} />
					</Link>
				</div>
			</div>
		);

	const handleOpenOrder = (order: IOrder) => {
		// Всегда ведём по нашему человекочитаемому orderId, а не по _id.
		const orderId = order.orderId || order._id;
		if (!orderId) return;
		router.push(progectPathes.ordersId.path + orderId);
	};

	const handleEditOrder = (event: React.MouseEvent, order: IOrder, status?: IOrder["status"]) => {
		event.stopPropagation();
		const orderId = order.orderId || order._id;
		if (!orderId || !status) return;

		// Редактировать можно только заказы в статусе "Создано".
		// Все остальные статусы считаем "выше чем создано" и блокируем редактирование.
		if (status !== "Created") return;

		// Открываем редактор конкретного заказа
		router.push(`${progectPathes.ordersId.path}${orderId}/edit`);
	};

	const handleDeleteOrder = async (event: React.MouseEvent, order: IOrder, status?: IOrder["status"]) => {
		event.stopPropagation();
		const orderId = order.orderId || order._id;
		if (!orderId || !status) return;

		// Удалять пользователь может только заказы в статусе "Создано".
		// Все статусы выше (одобрена отправка, оплачено, отправлено, прибыло, доставлено, получено)
		// считаем зафиксированными и не даём их удалять.
		if (status !== "Created") return;

		const confirmed = window.confirm("Вы действительно хотите удалить этот заказ?");
		if (!confirmed) return;

		try {
			setDeletingId(orderId);
			const res = await fetch(`/api/orders/${orderId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data?.message || "Не удалось удалить заказ");
				return;
			}

			setList((prev) => prev.filter((o) => (o.orderId || o._id) !== orderId));
		} catch (error) {
			alert("Ошибка удаления заказа, попробуйте ещё раз");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className={styles.listWrapper}>
			{list.map((order) => {
				// Для пользователя редактирование и удаление доступны только в статусе "Created".
				// Для всех остальных статусов кнопки действий скрываем.
				const isLocked = order.status !== "Created";
				return (
					<div key={order._id} className={styles.orderCard} onClick={() => handleOpenOrder(order)}>
						<div className={styles.orderCardTop}>
							<div className={styles.orderIdRow}>
								<span className={styles.orderIdLabel}>Заказ:</span>
								{/* Показываем человекочитаемый ID (orderId), а при его отсутствии — технический _id. */}
								<span className={styles.orderIdValue}>#{order.orderId || order._id}</span>
							</div>
							{!isLocked && (
								<div className={styles.orderActionsRow}>
									<button type="button" className={styles.orderActionButton} onClick={(event) => handleEditOrder(event, order, order.status)}>
										Редактировать
									</button>
									<button
										type="button"
										className={`${styles.orderActionButton} ${styles.orderActionDanger}`}
										onClick={(event) => handleDeleteOrder(event, order, order.status)}
										disabled={deletingId === (order.orderId || order._id)}
									>
										{deletingId === (order.orderId || order._id) ? "Удаляем..." : "Удалить"}
									</button>
								</div>
							)}
						</div>

						<div className={styles.orderCardBody}>
							<BoxSmallIco className={styles.orderIcon} />
							<div className={styles.orderContent}>
								<div className={styles.orderHeader}>
									<div className={styles.orderDescription}>{order.description}</div>
								</div>

								<div className={styles.orderMetaRow}>
									<div className={styles.orderShop}>{order.shopUrl}</div>
									<div className={styles.orderTrack}>{order.track}</div>
								</div>
								<div className={styles.orderFooter}>
									<div className={styles.orderStatusRow}>
										<div className={styles.orderStatusLabel}>статус</div>
										<div className={styles.orderStatusValue}>{StatusEnToRu[order.status]}</div>
									</div>
									<div className={styles.orderDate}>{new Date(order.createdAt || 0).toLocaleString()}</div>
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
