"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { IAdress } from "@/mongodb/models/adressModel";
import { progectPathes } from "@/config/pathes";
import styles from "@/components/lists/OrdersList/OrdersList.module.scss";

// Список адресов в стиле списка заказов.
export default function UserAdressesList({ adresses }: { adresses: IAdress[] }) {
	const [list, setList] = useState<IAdress[]>(adresses);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const router = useRouter();

	const getFullName = (adress: IAdress) => {
		// ФИО собираем в одну строку, разделяя пробелами только непустые части
		const parts = [adress.recipientSurname, adress.recipientName, adress.recipientPatronymic].filter(Boolean);
		return parts.join(" ");
	};

	const handleOpenAdress = (adressId?: string) => {
		if (!adressId) return;
		router.push(progectPathes.addressId.path + adressId);
	};

	const handleDeleteAdress = async (event: React.MouseEvent, adressId?: string) => {
		event.stopPropagation();
		if (!adressId) return;

		const confirmed = window.confirm("Вы действительно хотите удалить этот адрес?");
		if (!confirmed) return;

		try {
			setDeletingId(adressId);
			const res = await fetch(`/api/adresses/${adressId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data?.message || "Не удалось удалить адрес");
				return;
			}

			setList((prev) => prev.filter((adress) => adress._id !== adressId));
		} catch (error) {
			alert("Ошибка удаления адреса, попробуйте ещё раз");
		} finally {
			setDeletingId(null);
		}
	};

	if (!list.length) {
		return (
			<div className={styles.emptyWrapper}>
				<div className={styles.emptyBox}>
					<div className={styles.emptyTitle}>У вас ещё нет сохранённых адресов</div>
					<Link href={progectPathes.address_book.path + "/adress_new"} className={styles.createButton}>
						<span className={styles.createButtonText}>Добавить адрес</span>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.listWrapper}>
			{list.map((adress) => {
				const title = adress.isBusiness ? adress.companyName || "Адрес компании" : getFullName(adress) || "Адрес получателя";
				const metaLine = [adress.country, adress.city, adress.adress].filter(Boolean).join(", ");

				return (
					<div key={adress._id} className={styles.orderCard} onClick={() => handleOpenAdress(adress._id)}>
						<div className={styles.orderCardTop}>
							<div className={styles.orderIdRow}>
								<span className={styles.orderIdLabel}>Адрес</span>
								<span className={styles.orderIdValue}>{adress._id}</span>
							</div>
							<div className={styles.orderActionsRow}>
								<Link href={progectPathes.addressId.path + adress._id} className={styles.orderActionButton} onClick={(event) => event.stopPropagation()}>
									Редактировать
								</Link>
								<button
									type="button"
									className={`${styles.orderActionButton} ${styles.orderActionDanger}`}
									onClick={(event) => handleDeleteAdress(event, adress._id)}
									disabled={deletingId === adress._id}
								>
									{deletingId === adress._id ? "Удаляем..." : "Удалить"}
								</button>
							</div>
						</div>

						<div className={styles.orderCardBody}>
							<div className={styles.orderContent}>
								<div className={styles.orderHeader}>
									<div className={styles.orderDescription}>{title}</div>
								</div>

								<div className={styles.orderMetaRow}>
									<div className={styles.orderShop}>{metaLine}</div>
									<div className={styles.orderTrack}>{adress.phone1 || "-"}</div>
								</div>

								{/* Дополнительная строка с подробностями по адресу */}
								<div className={styles.orderMetaRow}>
									<div className={styles.orderShop}>{adress.deliveryMethod === "warehouse" ? "Доставка до склада" : "Доставка до двери (курьер)"}</div>
									<div className={styles.orderTrack}>
										{adress.recipientEmail ? `Email: ${adress.recipientEmail}` : adress.phone2 ? `Телефон 2: ${adress.phone2}` : ""}
									</div>
								</div>

								<div className={styles.orderFooter}>
									<div className={styles.orderStatusRow}>
										<div className={styles.orderStatusLabel}>тип</div>
										<div className={styles.orderStatusValue}>{adress.isBusiness ? "Бизнес" : "Персональный"}</div>
									</div>
									<div className={styles.orderDate}>{adress.createdAt ? new Date(adress.createdAt).toLocaleString() : ""}</div>
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
