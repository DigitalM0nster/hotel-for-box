"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CloseIco, GroupsCombineIco, GroupsSplitIco, PlusIco } from "@/icons/icons";
import styles from "@/app/(user)/user/orders/OrdersPage.module.scss";
import { IOrder } from "@/mongodb/models/orderModel";

type OrdersActionsBarProps = {
	createHref: string;
	orders: IOrder[];
};

type SelectionMap = Record<string, boolean>;

export default function OrdersActionsBar({ createHref, orders }: OrdersActionsBarProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
	const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
	const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
	const [selectedMerge, setSelectedMerge] = useState<SelectionMap>({});
	const [selectedSplit, setSelectedSplit] = useState<SelectionMap>({});

	const hasOrders = orders.length > 0;
	const groupedOrders = useMemo(() => orders.filter((o) => !!o.groupId), [orders]);
	const mergeDisabled = !hasOrders;
	const splitDisabled = groupedOrders.length === 0;

	// Следим за шириной экрана, чтобы переключать режим отображения панели
	useEffect(() => {
		const updateIsMobile = () => setIsMobile(window.innerWidth <= 768);
		updateIsMobile();
		window.addEventListener("resize", updateIsMobile);
		return () => window.removeEventListener("resize", updateIsMobile);
	}, []);

	const toggleSelect = (id: string, setter: React.Dispatch<React.SetStateAction<SelectionMap>>) => {
		setter((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const getSelectedIds = (map: SelectionMap) =>
		Object.entries(map)
			.filter(([, v]) => v)
			.map(([id]) => id);

	const handleMergeSubmit = async () => {
		const ids = getSelectedIds(selectedMerge);
		if (ids.length < 2) {
			alert("Нужно выбрать минимум два заказа для объединения.");
			return;
		}
		try {
			const res = await fetch("/api/orders/merge", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderIds: ids }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Ошибка объединения");
			alert("Заказы объединены");
			window.location.reload();
		} catch (error: any) {
			alert(error.message || "Ошибка объединения заказов");
		}
	};

	const handleSplitSubmit = async () => {
		const ids = getSelectedIds(selectedSplit);
		if (!ids.length) {
			alert("Выберите хотя бы один заказ для разделения (исключения из группы).");
			return;
		}
		try {
			const res = await fetch("/api/orders/split", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderIds: ids }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Ошибка разделения");
			alert("Заказы разделены");
			window.location.reload();
		} catch (error: any) {
			alert(error.message || "Ошибка разделения заказов");
		}
	};

	return (
		<>
			<div className={`${styles.actionsDesktop} ${isMobile ? styles.actionsDesktopHidden : ""}`}>
				<Link href={createHref} className={`${styles.actionButton} ${styles.actionPrimary}`}>
					<div className={styles.actionTextPrimary}>Создать заказ</div>
					<PlusIco width={18} height={18} />
				</Link>
				<button
					type="button"
					className={`${styles.actionButton} ${styles.actionSecondary} ${mergeDisabled ? styles.actionDisabled : ""}`}
					onClick={() => setIsMergeModalOpen(true)}
					aria-disabled={mergeDisabled}
					disabled={mergeDisabled}
				>
					<div className={styles.actionTextSecondary}>Объединить группы</div>
					<GroupsCombineIco width={18} height={18} />
				</button>
				<button
					type="button"
					className={`${styles.actionButton} ${styles.actionSecondary} ${splitDisabled ? styles.actionDisabled : ""}`}
					onClick={() => setIsSplitModalOpen(true)}
					aria-disabled={splitDisabled}
					disabled={splitDisabled}
				>
					<div className={styles.actionTextSecondary}>Разделить заказ</div>
					<GroupsSplitIco width={18} height={18} />
				</button>
			</div>

			{isMobile && (
				<>
					<button type="button" className={`${styles.actionButton} ${styles.actionSecondary} ${styles.mobileTrigger}`} onClick={() => setIsMobilePanelOpen(true)}>
						<div className={styles.actionTextSecondary}>Действия</div>
						<PlusIco width={16} height={16} />
					</button>

					{isMobilePanelOpen && (
						<div className={styles.mobileOverlay}>
							<div className={styles.mobilePanel}>
								<div className={styles.mobilePanelHeader}>
									<div className={styles.actionTextSecondary}>Действия</div>
									<button type="button" onClick={() => setIsMobilePanelOpen(false)} className={styles.modalClose} aria-label="Закрыть список действий">
										<CloseIco />
									</button>
								</div>
								<div className={styles.mobilePanelActions}>
									<Link href={createHref} className={`${styles.actionButton} ${styles.actionPrimary}`} onClick={() => setIsMobilePanelOpen(false)}>
										<div className={styles.actionTextPrimary}>Создать заказ</div>
										<PlusIco width={18} height={18} />
									</Link>
									<button
										type="button"
										className={`${styles.actionButton} ${styles.actionSecondary} ${mergeDisabled ? styles.actionDisabled : ""}`}
										onClick={() => {
											setIsMergeModalOpen(true);
											setIsMobilePanelOpen(false);
										}}
										aria-disabled={mergeDisabled}
										disabled={mergeDisabled}
									>
										<div className={styles.actionTextSecondary}>Объединить группы</div>
										<GroupsCombineIco width={18} height={18} />
									</button>
									<button
										type="button"
										className={`${styles.actionButton} ${styles.actionSecondary} ${splitDisabled ? styles.actionDisabled : ""}`}
										onClick={() => {
											setIsSplitModalOpen(true);
											setIsMobilePanelOpen(false);
										}}
										aria-disabled={splitDisabled}
										disabled={splitDisabled}
									>
										<div className={styles.actionTextSecondary}>Разделить заказ</div>
										<GroupsSplitIco width={18} height={18} />
									</button>
								</div>
							</div>
						</div>
					)}
				</>
			)}
			{isMergeModalOpen && (
				<ModalShell title="Объединить заказы" onClose={() => setIsMergeModalOpen(false)}>
					<div className={styles.modalBody}>
						{orders.map((order) => (
							<label key={order._id} className={styles.modalItem}>
								{/* Для выбора/объединения тоже используем человекочитаемый ID (orderId), чтобы он совпадал с тем, что видит пользователь. */}
								<input
									type="checkbox"
									checked={!!selectedMerge[order.orderId || order._id || ""]}
									onChange={() => toggleSelect(order.orderId || order._id || "", setSelectedMerge)}
								/>
								<div className={styles.modalItemInfo}>
									<div className={styles.modalItemTitle}>{order.description}</div>
									<div className={styles.modalItemSub}>
										{order.track} · {order.shopUrl}
									</div>
								</div>
							</label>
						))}
					</div>
					<div className={styles.modalActions}>
						<button type="button" className={`${styles.actionButton} ${styles.actionSecondary}`} onClick={() => setIsMergeModalOpen(false)}>
							<div className={styles.actionTextSecondary}>Отмена</div>
						</button>
						<button type="button" className={`${styles.actionButton} ${styles.actionPrimary}`} onClick={handleMergeSubmit}>
							<div className={styles.actionTextPrimary}>Объединить</div>
						</button>
					</div>
				</ModalShell>
			)}

			{isSplitModalOpen && (
				<ModalShell title="Разделить (убрать из группы)" onClose={() => setIsSplitModalOpen(false)}>
					<div className={styles.modalBody}>
						{groupedOrders.length === 0 && <div className={styles.modalItemSub}>Нет заказов в группах.</div>}
						{groupedOrders.map((order) => (
							<label key={order._id} className={styles.modalItem}>
								<input
									type="checkbox"
									checked={!!selectedSplit[order.orderId || order._id || ""]}
									onChange={() => toggleSelect(order.orderId || order._id || "", setSelectedSplit)}
								/>
								<div className={styles.modalItemInfo}>
									<div className={styles.modalItemTitle}>{order.description}</div>
									<div className={styles.modalItemSub}>
										{order.track} · {order.shopUrl}
									</div>
									<div className={styles.modalItemGroup}>Группа: {order.groupId}</div>
								</div>
							</label>
						))}
					</div>
					<div className={styles.modalActions}>
						<button type="button" className={`${styles.actionButton} ${styles.actionSecondary}`} onClick={() => setIsSplitModalOpen(false)}>
							<div className={styles.actionTextSecondary}>Отмена</div>
						</button>
						<button
							type="button"
							className={`${styles.actionButton} ${styles.actionPrimary} ${splitDisabled ? styles.actionDisabled : ""}`}
							onClick={handleSplitSubmit}
							aria-disabled={splitDisabled}
							disabled={splitDisabled}
						>
							<div className={styles.actionTextPrimary}>Разделить</div>
						</button>
					</div>
				</ModalShell>
			)}
		</>
	);
}

type ModalShellProps = {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
};

function ModalShell({ title, onClose, children }: ModalShellProps) {
	return (
		<div className={styles.modalOverlay}>
			<div className={styles.modalShell}>
				<div className={styles.modalHeader}>
					<div className={styles.modalTitle}>{title}</div>
					<button type="button" onClick={onClose} className={styles.modalClose} aria-label="Закрыть">
						<CloseIco />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
