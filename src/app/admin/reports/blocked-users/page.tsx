"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../AdminDashboard.module.scss";
import DashboardDateFilter from "@/components/admin/DashboardDateFilter";

// Тип для заблокированного пользователя
type BlockedUser = {
	_id: string;
	publicId?: string;
	name: string;
	surname?: string;
	email: string;
	phone1: string;
	updatedAt?: Date;
};

// Страница отчёта "Заблокированные пользователи".
// Показывает список всех пользователей, которые были заблокированы администратором.
export default function BlockedUsersReportPage() {
	const [users, setUsers] = useState<BlockedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [dateFrom, setDateFrom] = useState<string | null>(null);
	const [dateTo, setDateTo] = useState<string | null>(null);

	// Функция для загрузки заблокированных пользователей
	const loadBlockedUsers = async (from: string | null, to: string | null) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (from) params.append("dateFrom", from);
			if (to) params.append("dateTo", to);

			const response = await fetch(`/api/admin/reports/blocked-users?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Ошибка загрузки пользователей");
			}

			const data = await response.json();
			setUsers(data.users || []);
		} catch (error) {
			console.error("Ошибка загрузки заблокированных пользователей:", error);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при первой загрузке страницы
	useEffect(() => {
		loadBlockedUsers(null, null);
	}, []);

	// Обработчик применения фильтра по датам
	const handleFilterApply = (from: string | null, to: string | null) => {
		setDateFrom(from);
		setDateTo(to);
		loadBlockedUsers(from, to);
	};

	// Форматируем дату
	const formatDate = (date: Date | string | undefined): string => {
		if (!date) return "-";
		const d = new Date(date);
		if (isNaN(d.getTime())) return "-";
		return d.toLocaleDateString("ru-RU", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<section className={styles.card}>
			<div className={styles.cardTitle}>Заблокированные пользователи</div>

			{/* Фильтр по датам */}
			<DashboardDateFilter onApply={handleFilterApply} />

			{loading ? (
				<div className={styles.loadingState}>Загрузка данных...</div>
			) : users.length === 0 ? (
				<div className={styles.loadingState}>Нет заблокированных пользователей</div>
			) : (
				<div className={styles.reportsTableWrapper}>
					<table className={styles.reportsTable}>
						<thead>
							<tr>
								<th>ID</th>
								<th>Имя</th>
								<th>Email</th>
								<th>Телефон</th>
								<th>Дата блокировки</th>
								<th>Действия</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr key={user._id}>
									<td>{user.publicId || user._id.slice(-8)}</td>
									<td>
										{user.name} {user.surname || ""}
									</td>
									<td>{user.email}</td>
									<td>{user.phone1}</td>
									<td>{formatDate(user.updatedAt)}</td>
									<td>
										<Link href={`/admin/users/${user._id}`} className={styles.reportActionLink}>
											Просмотр
										</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
