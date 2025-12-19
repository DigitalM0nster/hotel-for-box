"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteOrderBySuperAdmin } from "@/libs/services/orderService";
import { toast } from "react-toastify";
import styles from "@/components/admin/AdminTable.module.scss";

// Клиентский компонент для кнопки удаления заказа.
// Показывается только суперадмину, при клике запрашивает подтверждение,
// затем вызывает серверную функцию удаления и перенаправляет на список заказов.
export default function DeleteOrderButton({ orderId }: { orderId: string }) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!confirm("Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.")) {
			return;
		}

		try {
			setIsDeleting(true);
			const result = await deleteOrderBySuperAdmin(orderId);

			if (result.type === "success") {
				toast.success("Заказ успешно удалён");
				router.push("/admin/orders");
			} else {
				toast.error(result.message || "Не удалось удалить заказ");
				setIsDeleting(false);
			}
		} catch (error) {
			toast.error("Ошибка при удалении заказа");
			setIsDeleting(false);
		}
	};

	return (
		<button type="button" onClick={handleDelete} disabled={isDeleting} className={`${styles.adminTableActionButton} ${styles.adminTableActionDanger}`}>
			{isDeleting ? "Удаляем..." : "Удалить заказ"}
		</button>
	);
}
