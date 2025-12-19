"use client";

import { useState } from "react";
import Link from "next/link";

import styles from "@/components/lists/OrdersList/OrdersList.module.scss";
import { IAdress } from "@/mongodb/models/adressModel";

type AdminUserAddressesListProps = {
	adresses: IAdress[];
	currentAdminRole: string;
	userId: string;
};

// Список адресов конкретного пользователя для администрации.
// Здесь суперадминистратор может открыть форму редактирования адреса
// (та же форма, что и у пользователя) и удалить любой адрес.
export default function AdminUserAddressesList({ adresses, currentAdminRole, userId }: AdminUserAddressesListProps) {
	const [list, setList] = useState<IAdress[]>(adresses);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	if (!list.length) {
		return <div>У этого пользователя пока нет сохранённых адресов.</div>;
	}

	const isSuperAdmin = currentAdminRole === "super";

	const getRecipientTitle = (adress: IAdress) => {
		if (adress.isBusiness) {
			return adress.companyName || "Адрес компании";
		}

		const parts = [adress.recipientSurname, adress.recipientName, adress.recipientPatronymic].filter(Boolean);
		return parts.length ? parts.join(" ") : "Адрес получателя";
	};

	const getDeliveryMethodLabel = (adress: IAdress) => {
		if (adress.deliveryMethod === "warehouse") return "Доставка до склада";
		if (adress.deliveryMethod === "courier") return "Доставка до двери (курьер)";
		return "Тип доставки не указан";
	};

	const handleDeleteAdress = async (adressId?: string) => {
		if (!adressId) return;

		const confirmed = window.confirm("Вы действительно хотите удалить этот адрес?");
		if (!confirmed) return;

		try {
			setDeletingId(adressId);

			// Вызываем тот же API, что и пользователь.
			// В самом обработчике мы отдельно разрешим суперадминистратору
			// удалять любой адрес, а не только свой.
			const res = await fetch(`/api/adresses/${adressId}`, {
				method: "DELETE",
			});
			const data = await res.json();

			if (!res.ok) {
				alert(data?.message || "Не удалось удалить адрес");
				return;
			}

			setList((prev) => prev.filter((adress) => adress._id !== adressId));
		} catch (_error) {
			alert("Ошибка удаления адреса, попробуйте ещё раз");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className={styles.listWrapper}>
			{list.map((adress) => (
				<div key={adress._id} className={styles.orderCard}>
					<div className={styles.orderCardTop}>
						<div className={styles.orderIdRow}>
							<span className={styles.orderIdLabel}>ID адреса</span>
							<span className={styles.orderIdValue}>{adress._id}</span>
						</div>

						{isSuperAdmin && (
							<div className={styles.orderActionsRow}>
								{/* Редактирование адреса в кабинете администратора, а не в личном кабинете пользователя. */}
								<Link href={`/admin/users/${userId}/addresses/${adress._id}`} className={styles.orderActionButton}>
									Редактировать
								</Link>
								<button
									type="button"
									className={styles.orderActionButton + " " + styles.orderActionDanger}
									onClick={() => handleDeleteAdress(adress._id)}
									disabled={deletingId === adress._id}
								>
									{deletingId === adress._id ? "Удаляем..." : "Удалить"}
								</button>
							</div>
						)}
					</div>

					<div className={styles.orderCardBody}>
						<div className={styles.orderContent}>
							<div className={styles.orderHeader}>
								<div className={styles.orderDescription}>{getRecipientTitle(adress)}</div>
								<div className={styles.orderId}>{adress.phone1}</div>
							</div>

							<div className={styles.orderMetaRow}>
								<div className={styles.orderShop}>
									{[adress.country, adress.city, adress.adress].filter(Boolean).join(", ")}
									{adress.zip_code ? `, индекс: ${adress.zip_code}` : ""}
								</div>
								<div className={styles.orderTrack}>{getDeliveryMethodLabel(adress)}</div>
							</div>

							<div className={styles.orderFooter}>
								<div className={styles.orderStatusRow}>
									<div className={styles.orderStatusLabel}>Тип</div>
									<div className={styles.orderStatusValue}>{adress.isBusiness ? "Бизнес" : "Физическое лицо"}</div>
								</div>

								<div className={styles.orderStatusRow}>
									<div className={styles.orderStatusLabel}>По умолчанию</div>
									<div className={styles.orderStatusValue}>{adress.isDefault ? "Да" : "Нет"}</div>
								</div>

								<div className={styles.orderStatusRow}>
									<div className={styles.orderStatusLabel}>Подтверждён</div>
									<div className={styles.orderStatusValue}>{adress.isConfirmed ? "Да" : "Нет"}</div>
								</div>

								<div className={styles.orderDate}>{adress.createdAt ? new Date(adress.createdAt).toLocaleString() : ""}</div>
							</div>

							{/* Блок с контактами и заметкой администратора.
								Если заметки нет, показываем простой прочерк. */}
							<div className={styles.orderMetaRow}>
								<div className={styles.orderShop}>{adress.recipientEmail ? `Email получателя: ${adress.recipientEmail}` : "-"}</div>
								<div className={styles.orderTrack}>Заметка администратора: {adress.admin_description || "-"}</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
