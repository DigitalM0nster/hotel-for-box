import { auth } from "@/auth";
import styles from "../../../../AdminDashboard.module.scss";
import { getAdressById } from "@/libs/services/adressService";
import { getUserByIdForAdmin } from "@/libs/services/usersService";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdressFrom from "@/components/forms/adressFrom";

// Страница редактирования конкретного адреса пользователя в админке.
// Здесь администратор/суперадминистратор использует ту же форму адреса,
// но остаётся в кабинете администратора.
export default async function AdminUserAdressEditPage({
	params,
}: {
	params: {
		id: string;
		adressId: string;
	};
}) {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Редактирование адреса</div>
					<div>Доступ к редактированию адресов есть только у администратора.</div>
				</section>
			</div>
		);
	}

	const user = await getUserByIdForAdmin({ id: params.id });
	const adress = await getAdressById({ id: params.adressId });

	if (!user || !adress) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Редактирование адреса</div>
					<div>Пользователь или адрес не найдены.</div>
					<AdminBackButton className={styles.applyButton} />
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
					<div className={styles.cardTitle}>Редактирование адреса</div>
					<AdminBackButton className={styles.applyButton} />
				</div>

				<div style={{ marginBottom: "16px" }}>
					<div>
						<strong>Пользователь:</strong> {user.surname} {user.name} {user.patronymic}
					</div>
					<div>
						<strong>Email:</strong> {user.email}
					</div>
					<div>
						<strong>Основной телефон:</strong> {user.phone1}
					</div>
				</div>

				{/* В форму передаём ID пользователя и путь, куда вернуться после сохранения. */}
				<AdressFrom adress={adress} userId={params.id} redirectPathAfterSave={`/admin/users/${params.id}/addresses`} />
			</section>
		</div>
	);
}
