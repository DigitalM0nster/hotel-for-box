import { auth } from "@/auth";
import styles from "../../../AdminDashboard.module.scss";
import { getUserByIdForAdmin } from "@/libs/services/usersService";
import { getAdressesByUserIdForAdmin } from "@/libs/services/adressService";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminUserAddressesList from "@/components/admin/AdminUserAddressesList";

// Страница просмотра адресов конкретного пользователя для администратора.
// Суперадминистратор на этой странице может редактировать и удалять адреса.
export default async function AdminUserAddressesPage({ params }: { params: { id: string } }) {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Адреса пользователя</div>
					<div>Доступ к адресам пользователей есть только у администратора.</div>
				</section>
			</div>
		);
	}

	const user = await getUserByIdForAdmin({ id: params.id });
	const adresses = await getAdressesByUserIdForAdmin({ userId: params.id });

	if (!user) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Адреса пользователя</div>
					<div>Пользователь не найден.</div>
				</section>
			</div>
		);
	}

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
					<div className={styles.cardTitle}>Адреса пользователя</div>
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

				<AdminUserAddressesList adresses={adresses} currentAdminRole={session.user.role} userId={params.id} />
			</section>
		</div>
	);
}
