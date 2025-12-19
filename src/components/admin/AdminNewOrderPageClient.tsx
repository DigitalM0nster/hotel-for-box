"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/admin/AdminDashboard.module.scss";
import tableStyles from "@/components/admin/AdminTable.module.scss";
import OrderForm from "@/components/forms/orderForm";
import { Input } from "@/components/ui/FormElements/Input";
import PhoneSimple from "@/components/ui/FormElements/PhoneSimple";
import { getUsersForAdmin, registerUser } from "@/libs/services/usersService";
import { IUser } from "@/mongodb/models/userModel";
import { toast } from "react-toastify";

type Mode = "existing" | "new";

// Клиентский компонент для создания заказа в админке.
// Сверху выбираем / создаём пользователя, снизу — та же форма заказа, что и в ЛК.
export default function AdminNewOrderPageClient() {
	const [mode, setMode] = useState<Mode>("existing");

	// Состояние выбранного пользователя (для передачи в OrderForm).
	const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

	// --- Режим "Существующий пользователь" ---
	const [searchValue, setSearchValue] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [foundUsers, setFoundUsers] = useState<IUser[]>([]);

	// --- Режим "Новый пользователь" ---
	const [newUserForm, setNewUserForm] = useState({
		name: "",
		surname: "",
		patronymic: "",
		email: "",
		phone1: "",
		password: "",
		confirmPassword: "",
	});
	const [isCreatingUser, setIsCreatingUser] = useState(false);

	const handleModeChange = (nextMode: Mode) => {
		setMode(nextMode);
		// При переключении режима сбрасываем выбранного пользователя,
		// чтобы не возникало путаницы.
		setSelectedUser(null);
	};

	// Поиск существующих пользователей по ФИО / email / телефону / ID.
	const handleSearchUsers = async () => {
		if (!searchValue.trim()) {
			toast.warning("Введите ФИО, email, телефон или ID для поиска.");
			return;
		}

		try {
			setIsSearching(true);
			const res = await getUsersForAdmin({
				search: searchValue.trim(),
				limit: 20,
			});
			setFoundUsers(res.users);

			if (res.users.length === 0) {
				toast.info("Пользователи не найдены, попробуйте изменить запрос или создайте нового пользователя.");
			}
		} catch (error) {
			toast.error("Ошибка при поиске пользователей, попробуйте позже.");
		} finally {
			setIsSearching(false);
		}
	};

	const handleSelectUser = (user: IUser) => {
		setSelectedUser(user);
		toast.success("Пользователь выбран. Ниже можно заполнить заказ для него.");
		// Скроллим страницу вверх при выборе пользователя, чтобы показать форму заказа
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// Обновление полей формы "Новый пользователь".
	const updateNewUserField = (field: keyof typeof newUserForm, value: string) => {
		setNewUserForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Валидация минимального набора данных нового пользователя.
	const isNewUserFormValid = (): boolean => {
		const hasBaseFields =
			newUserForm.name.trim().length > 0 &&
			newUserForm.email.trim().length > 0 &&
			newUserForm.phone1.trim().length > 0 &&
			newUserForm.password.trim().length >= 6 &&
			newUserForm.confirmPassword.trim().length >= 6;

		if (!hasBaseFields) {
			return false;
		}

		// Пароль и подтверждение должны совпадать
		return newUserForm.password === newUserForm.confirmPassword;
	};

	// Создаём нового пользователя от имени админа и сразу выбираем его.
	const handleCreateNewUser = async () => {
		if (newUserForm.password.trim().length < 6 || newUserForm.confirmPassword.trim().length < 6 || newUserForm.password !== newUserForm.confirmPassword) {
			toast.warning("Пароль и подтверждение должны быть заполнены и совпадать (минимум 6 символов).");
			return;
		}

		if (!isNewUserFormValid()) {
			toast.warning("Заполните имя, email и телефон пользователя.");
			return;
		}

		try {
			setIsCreatingUser(true);

			const result = await registerUser({
				name: newUserForm.name.trim(),
				email: newUserForm.email.trim(),
				phone1: newUserForm.phone1.trim(),
				password: newUserForm.password,
				// Необязательные поля, которые тоже хотим сохранить.
				surname: newUserForm.surname.trim() || undefined,
				patronymic: newUserForm.patronymic.trim() || undefined,
				// Админ создаёт обычного пользователя.
				role: "user",
				// Сразу помечаем, что пользователь подтверждён админом.
				isVerifiedByAdmin: true,
			});

			if (result.type !== "success") {
				toast.warning(result.message || "Не удалось создать пользователя.");
				return;
			}

			// После успешного создания, находим этого пользователя по email
			// и делаем его "выбранным" для формы заказа.
			const searchRes = await getUsersForAdmin({
				emailFilter: newUserForm.email.trim(),
				limit: 1,
			});

			if (!searchRes.users.length) {
				toast.warning("Пользователь успешно создан, но не найден в списке. Обновите страницу и попробуйте ещё раз.");
				return;
			}

			const createdUser = searchRes.users[0];
			setSelectedUser(createdUser);
			toast.success("Пользователь создан. Ниже можно оформить для него заказ.");
		} catch (error) {
			toast.error("Ошибка при создании пользователя, попробуйте позже.");
		} finally {
			setIsCreatingUser(false);
		}
	};

	return (
		<div className={styles.cardsColumn}>
			<section className={styles.card}>
				<div className={styles.cardTitle}>Создание нового заказа</div>

				{/* Показываем блок выбора/создания пользователя только если клиент ещё не выбран */}
				{!selectedUser && (
					<>
						<div className={styles.newOrderInfoText}>
							Сначала выберите клиента (существующего или нового), а затем заполните данные заказа ниже. Заказ всегда привязан к конкретному пользователю.
						</div>

						{/* Переключатель режимов: существующий / новый пользователь */}
						<div className={styles.newUserModeButtonsRow}>
							<button
								type="button"
								onClick={() => handleModeChange("existing")}
								className={`${styles.newUserModeButton} ${mode === "existing" ? styles.newUserModeButtonActive : ""}`}
							>
								Выбрать существующего пользователя
							</button>
							<button
								type="button"
								onClick={() => handleModeChange("new")}
								className={`${styles.newUserModeButton} ${mode === "new" ? styles.newUserModeButtonActive : ""}`}
							>
								Создать нового пользователя
							</button>
						</div>

						{/* Блок "Существующий пользователь" */}
						{mode === "existing" && (
							<div className={styles.newUserExistingBlock}>
								<div className={styles.newUserBlockDescription}>Поиск по ФИО, email, телефону или ID пользователя.</div>
								<div className={styles.newUserSearchRow}>
									<input
										type="text"
										value={searchValue}
										onChange={(e) => setSearchValue(e.target.value)}
										placeholder="Например: Иванов Иван, +7..., user@mail.com или U0000..."
										className={styles.newUserSearchInput}
									/>
									<button type="button" onClick={handleSearchUsers} disabled={isSearching} className={styles.newUserSearchButton}>
										{isSearching ? "Ищем..." : "Найти"}
									</button>
								</div>

								{foundUsers.length > 0 && (
									<div className={styles.newUserSearchResultsWrapper}>
										<table className={tableStyles.adminTable}>
											<thead>
												<tr>
													<th>ID</th>
													<th>Имя</th>
													<th>Email</th>
													<th>Телефон</th>
													<th>Действия</th>
												</tr>
											</thead>
											<tbody>
												{foundUsers.map((user) => (
													<tr key={user._id} className={tableStyles.adminTableRow}>
														<td>{user.publicId || user._id}</td>
														<td>{[user.surname, user.name, user.patronymic].filter(Boolean).join(" ") || user.name}</td>
														<td>{user.email}</td>
														<td>{user.phone1}</td>
														<td>
															<button type="button" onClick={() => handleSelectUser(user)} className={tableStyles.adminTableActionButton}>
																Выбрать
															</button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}

								{foundUsers.length === 0 && (
									<div className={styles.newUserTableNote}>Найдите пользователя по данным выше или переключитесь во вкладку «Создать нового пользователя».</div>
								)}
							</div>
						)}

						{/* Блок "Новый пользователь" */}
						{mode === "new" && (
							<div className={`${styles.newUserBlock} newUserBlock`}>
								<div className={styles.newUserBlockDescription}>
									Укажите минимальные данные нового пользователя. После сохранения для него можно будет оформить заказ.
								</div>

								<div className={styles.newUserGridRow}>
									<Input title="Фамилия" value={newUserForm.surname} onChange={(e) => updateNewUserField("surname", e.target.value)} />
									<Input title="Имя*" value={newUserForm.name} onChange={(e) => updateNewUserField("name", e.target.value)} />
									<Input title="Отчество" value={newUserForm.patronymic} onChange={(e) => updateNewUserField("patronymic", e.target.value)} />
								</div>

								<div className={styles.newUserGridRow}>
									<Input title="Email*" type="email" value={newUserForm.email} onChange={(e) => updateNewUserField("email", e.target.value)} />
								</div>

								<div className={styles.newUserGridRow}>
									<div>
										<PhoneSimple
											value={newUserForm.phone1}
											onChange={(value) => updateNewUserField("phone1", value)}
											title="Телефон*"
											placeholder="Введите номер телефона"
										/>
									</div>
									<Input
										title="Пароль для входа* (мин. 6 символов)"
										type="password"
										hideEye
										value={newUserForm.password}
										onChange={(e) => updateNewUserField("password", e.target.value)}
									/>
									<Input
										title="Подтверждение пароля*"
										type="password"
										hideEye
										value={newUserForm.confirmPassword}
										onChange={(e) => updateNewUserField("confirmPassword", e.target.value)}
									/>
								</div>

								<button
									type="button"
									onClick={handleCreateNewUser}
									disabled={isCreatingUser}
									className={`${styles.newUserCreateButton} ${isCreatingUser ? styles.newUserCreateButtonDisabled : ""}`}
								>
									{isCreatingUser ? "Создаём пользователя..." : "Создать пользователя"}
								</button>

								<div className={styles.newUserCreateHint}>После создания пользователя его данные появятся ниже в форме заказа.</div>
							</div>
						)}
					</>
				)}

				{/* Информация о выбранном пользователе (для наглядности перед формой заказа) */}
				{selectedUser && (
					<div className={styles.newUserSelectedBox}>
						<div className={styles.newUserSelectedTitle}>Текущий клиент для заказа</div>
						<div>{[selectedUser.surname, selectedUser.name, selectedUser.patronymic].filter(Boolean).join(" ") || selectedUser.name}</div>
						<div className={styles.newUserSelectedSecondary}>
							ID: {selectedUser.publicId || selectedUser._id} · {selectedUser.email} {selectedUser.phone1 ? `· ${selectedUser.phone1}` : ""}
						</div>
						<div className={styles.newUserSelectedLink}>
							<Link
								href={`/admin/users/${selectedUser.publicId || selectedUser._id}`}
								target="_blank"
								rel="noopener noreferrer"
								className={`${styles.newUserProfileLink} ${styles.link}`}
							>
								Открыть профиль пользователя →
							</Link>
						</div>
					</div>
				)}

				{/* Блок формы заказа: показываем только когда есть выбранный пользователь */}
				{selectedUser ? (
					<OrderForm user={selectedUser} order={null} isAdmin={true} />
				) : (
					<div className={styles.newUserTableNote}>Сначала выберите или создайте пользователя выше, затем появится форма оформления заказа.</div>
				)}
			</section>
		</div>
	);
}
