import { auth } from "@/auth";
import styles from "../AdminDashboard.module.scss";
import { getUsersForAdmin } from "@/libs/services/usersService";
import AdminUsersList from "@/components/admin/AdminUsersList";
import Link from "next/link";

type AdminUsersPageProps = {
	searchParams: {
		page?: string;
		sortField?: string;
		sortDirection?: string;
		verified?: string;
		role?: string;
		createdFrom?: string;
		createdTo?: string;
		// Поисковые фильтры по колонкам.
		idFilter?: string;
		emailFilter?: string;
		fioFilter?: string;
		phoneFilter?: string;
		cityFilter?: string;
	};
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
	const session = await auth();

	if (!session || (session.user.role !== "admin" && session.user.role !== "super")) {
		return (
			<div className={styles.cardsColumn}>
				<section className={styles.card}>
					<div className={styles.cardTitle}>Пользователи</div>
					<div>Доступ к разделу пользователей есть только у администратора.</div>
				</section>
			</div>
		);
	}

	// Разбираем параметры из адресной строки. Здесь админ будет переключать страницы и сортировку.
	const page = Number(searchParams.page) > 0 ? Number(searchParams.page) : 1;
	const sortField = (searchParams.sortField as "createdAt" | "email" | "name" | "city" | "role") || "createdAt";
	const sortDirection = (searchParams.sortDirection as "asc" | "desc") === "asc" ? "asc" : "desc";

	// Фильтр: подтверждён / не подтверждён.
	const verifiedFilter = searchParams.verified === "yes" || searchParams.verified === "no" ? (searchParams.verified as "yes" | "no") : undefined;

	// Фильтр по роли пользователя.
	const roleFilter =
		searchParams.role === "user" || searchParams.role === "admin" || searchParams.role === "super" ? (searchParams.role as "user" | "admin" | "super") : undefined;

	// Фильтр по дате создания.
	const createdFrom = searchParams.createdFrom || undefined;
	const createdTo = searchParams.createdTo || undefined;

	// Поисковые строки по отдельным колонкам.
	const idFilter = searchParams.idFilter || undefined;
	const emailFilter = searchParams.emailFilter || undefined;
	const fioFilter = searchParams.fioFilter || undefined;
	const phoneFilter = searchParams.phoneFilter || undefined;
	const cityFilter = searchParams.cityFilter || undefined;

	// Фиксируем размер страницы, чтобы сервер всегда отдавал небольшие куски.
	const PAGE_LIMIT = 50;

	const { users, totalPages, total } = await getUsersForAdmin({
		page,
		limit: PAGE_LIMIT,
		sortField,
		sortDirection,
		verifiedFilter,
		roleFilter,
		createdFrom,
		createdTo,
		idFilter,
		emailFilter,
		fioFilter,
		phoneFilter,
		cityFilter,
	});

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Пользователи</div>

				<AdminUsersList users={users} page={page} totalPages={totalPages} sortField={sortField} sortDirection={sortDirection} />

				<Link href="/admin/users/create" className={styles.applyButton}>
					Добавить пользователя
				</Link>
			</section>
		</div>
	);
}
