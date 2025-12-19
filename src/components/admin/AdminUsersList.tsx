"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/components/admin/AdminTable.module.scss";
import { IUser } from "@/mongodb/models/userModel";

type AdminUsersListProps = {
	users: IUser[];
	// Номер текущей страницы, получаем от сервера.
	page: number;
	// Общее количество страниц.
	totalPages: number;
	// Текущее поле сортировки и направление — пригодятся, когда будем делать кликабельные заголовки.
	sortField: "createdAt" | "email" | "name" | "city" | "role";
	sortDirection: "asc" | "desc";
};

export default function AdminUsersList({ users, page, totalPages, sortField, sortDirection }: AdminUsersListProps) {
	// Локальное состояние списка, чтобы сразу убирать карточку после удаления.
	const [list, setList] = useState<IUser[]>(users);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	// Отдельные значения для поисковых фильтров по колонкам.
	const [columnFilters, setColumnFilters] = useState<{
		idFilter: string;
		emailFilter: string;
		fioFilter: string;
		phoneFilter: string;
		cityFilter: string;
		createdFromUi: string;
		createdToUi: string;
	}>({
		idFilter: "",
		emailFilter: "",
		fioFilter: "",
		phoneFilter: "",
		cityFilter: "",
		createdFromUi: "",
		createdToUi: "",
	});

	// Состояние для кастомного календаря.
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);
	const [activeDateField, setActiveDateField] = useState<"from" | "to" | null>(null);
	const today = new Date();
	const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
	const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth()); // 0-11
	const dateRangeRef = useRef<HTMLDivElement | null>(null);

	const router = useRouter();
	const searchParams = useSearchParams();

	// Если пропы поменялись (например, после серверного обновления), синхронизируем список.
	useEffect(() => {
		setList(users);
	}, [users]);

	// При первом рендере и при смене URL синхронизируем локальные поля поиска
	// с параметрами в адресной строке, чтобы инпуты всегда показывали актуальные значения.
	useEffect(() => {
		setColumnFilters({
			idFilter: searchParams.get("idFilter") || "",
			emailFilter: searchParams.get("emailFilter") || "",
			fioFilter: searchParams.get("fioFilter") || "",
			phoneFilter: searchParams.get("phoneFilter") || "",
			cityFilter: searchParams.get("cityFilter") || "",
			// Переводим формат с YYYY-MM-DD (в URL) в DD.MM.YYYY (для красивого отображения).
			createdFromUi: (() => {
				const value = searchParams.get("createdFrom");
				if (!value) return "";
				const [year, month, day] = value.split("-");
				if (!year || !month || !day) return "";
				return `${day}.${month}.${year}`;
			})(),
			createdToUi: (() => {
				const value = searchParams.get("createdTo");
				if (!value) return "";
				const [year, month, day] = value.split("-");
				if (!year || !month || !day) return "";
				return `${day}.${month}.${year}`;
			})(),
		});
	}, [searchParams]);

	// Дебаунс для текстовых фильтров: чтобы не стрелять запросами на каждый символ,
	// а чуть подождать, пока админ допечатает.
	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			const updates: Record<string, string | null> = {
				idFilter: columnFilters.idFilter.trim() || null,
				emailFilter: columnFilters.emailFilter.trim() || null,
				fioFilter: columnFilters.fioFilter.trim() || null,
				phoneFilter: columnFilters.phoneFilter.trim() || null,
				cityFilter: columnFilters.cityFilter.trim() || null,
			};
			handleFiltersChange(updates);
		}, 500);

		return () => {
			window.clearTimeout(timeoutId);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [columnFilters.idFilter, columnFilters.emailFilter, columnFilters.fioFilter, columnFilters.phoneFilter, columnFilters.cityFilter]);

	// Закрытие календаря при клике вне блока с датами.
	useEffect(() => {
		if (!isCalendarOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (!dateRangeRef.current) return;
			if (!dateRangeRef.current.contains(event.target as Node)) {
				setIsCalendarOpen(false);
				setActiveDateField(null);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isCalendarOpen]);

	// Помощник: парсим DD.MM.YYYY и возвращаем YYYY-MM-DD либо null, если формат неверный.
	const parseUiDateToIso = (value: string): string | null => {
		const trimmed = value.trim();
		if (!trimmed) return null;
		const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
		if (!match) return null;
		const [, dd, mm, yyyy] = match;
		return `${yyyy}-${mm}-${dd}`;
	};

	// Помощник: форматируем Date в строку вида DD.MM.YYYY.
	const formatDateToUi = (date: Date): string => {
		const dd = `${date.getDate()}`.padStart(2, "0");
		const mm = `${date.getMonth() + 1}`.padStart(2, "0");
		const yyyy = `${date.getFullYear()}`;
		return `${dd}.${mm}.${yyyy}`;
	};

	const handleDeleteUser = async (event: React.MouseEvent, userId?: string) => {
		event.stopPropagation();
		if (!userId) return;

		const confirmed = window.confirm("Вы действительно хотите удалить этого пользователя?");
		if (!confirmed) return;

		try {
			setDeletingId(userId);
			const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
			const data = await res.json();

			if (!res.ok) {
				alert(data?.message || "Не удалось удалить пользователя");
				return;
			}

			// Убираем пользователя из списка на клиенте.
			setList((prev) => prev.filter((user) => user._id !== userId));
		} catch (error) {
			alert("Ошибка удаления пользователя, попробуйте ещё раз");
		} finally {
			setDeletingId(null);
		}
	};

	const getFullName = (user: IUser) => {
		const parts = [user.surname, user.name, user.patronymic].filter(Boolean);
		return parts.join(" ") || user.name;
	};

	const getUserRoleLabel = (user: IUser) => {
		// Переводим техническое значение роли в человекочитаемый вид.
		if (user.role === "admin") return "Администратор";
		if (user.role === "super") return "Суперадминистратор";
		// По умолчанию считаем, что это обычный пользователь.
		return "Пользователь";
	};

	// Человекочитаемое название роли для панели активных фильтров.
	const getRoleFilterLabel = (role: string | null) => {
		if (role === "admin") return "Администратор";
		if (role === "super") return "Суперадминистратор";
		if (role === "user") return "Пользователь";
		return "";
	};

	// Человекочитаемые подписи для сортировки.
	const getSortFieldLabel = (field: AdminUsersListProps["sortField"]) => {
		if (field === "email") return "Почта";
		if (field === "name") return "ФИО";
		if (field === "city") return "Город";
		if (field === "role") return "Роль";
		// createdAt по умолчанию.
		return "Дата создания";
	};

	const getSortDirectionLabel = (direction: AdminUsersListProps["sortDirection"]) => {
		return direction === "asc" ? "по возрастанию" : "по убыванию";
	};

	// Небольшой помощник: собираем новую строку query-параметров.
	// Мы обновляем только переданные ключи и при необходимости сбрасываем номер страницы.
	const buildUpdatedQuery = (updates: Record<string, string | null>, resetPageIfNotProvided = false) => {
		const params = new URLSearchParams(searchParams.toString());

		Object.entries(updates).forEach(([key, value]) => {
			if (value === null || value === "") {
				params.delete(key);
			} else {
				params.set(key, value);
			}
		});

		// Если мы меняем фильтры и явно не передали page — сбрасываем её,
		// чтобы пользователь всегда попадал на первую страницу отфильтрованного списка.
		if (resetPageIfNotProvided && !Object.prototype.hasOwnProperty.call(updates, "page")) {
			params.delete("page");
		}

		return params.toString();
	};

	// Применение изменения страницы.

	const handleChangePage = (nextPage: number) => {
		if (nextPage < 1 || nextPage > totalPages) return;
		const query = buildUpdatedQuery({ page: String(nextPage) });
		router.push(query ? `/admin/users?${query}` : "/admin/users");
	};

	// Применение фильтров (подтверждён, роль, даты и текстовые) — всегда сбрасываем номер страницы.
	const handleFiltersChange = (updates: Record<string, string | null>) => {
		const query = buildUpdatedQuery(updates, true);
		router.push(query ? `/admin/users?${query}` : "/admin/users");
	};

	// Очистка всех фильтров одним кликом.
	const handleClearAllFilters = () => {
		// Сбрасываем локальные значения инпутов.
		setColumnFilters({
			idFilter: "",
			emailFilter: "",
			fioFilter: "",
			phoneFilter: "",
			cityFilter: "",
			createdFromUi: "",
			createdToUi: "",
		});

		// Удаляем все фильтрующие параметры из query.
		handleFiltersChange({
			idFilter: null,
			emailFilter: null,
			fioFilter: null,
			phoneFilter: null,
			cityFilter: null,
			role: null,
			verified: null,
			createdFrom: null,
			createdTo: null,
		});
	};

	// Собираем список активных фильтров для отображения над таблицей.
	// Каждый фильтр знает, какие query-параметры нужно очистить по клику.
	type ActiveFilter = {
		id: string;
		label: string;
		clearParams: Record<string, string | null>;
	};
	const activeFilters: ActiveFilter[] = [];

	const idFilterValue = searchParams.get("idFilter");
	if (idFilterValue) {
		activeFilters.push({
			id: "idFilter",
			label: `ID: ${idFilterValue}`,
			clearParams: { idFilter: null },
		});
	}

	const emailFilterValue = searchParams.get("emailFilter");
	if (emailFilterValue) {
		activeFilters.push({
			id: "emailFilter",
			label: `Почта: ${emailFilterValue}`,
			clearParams: { emailFilter: null },
		});
	}

	const fioFilterValue = searchParams.get("fioFilter");
	if (fioFilterValue) {
		activeFilters.push({
			id: "fioFilter",
			label: `ФИО: ${fioFilterValue}`,
			clearParams: { fioFilter: null },
		});
	}

	const phoneFilterValue = searchParams.get("phoneFilter");
	if (phoneFilterValue) {
		activeFilters.push({
			id: "phoneFilter",
			label: `Телефон: ${phoneFilterValue}`,
			clearParams: { phoneFilter: null },
		});
	}

	const cityFilterValue = searchParams.get("cityFilter");
	if (cityFilterValue) {
		activeFilters.push({
			id: "cityFilter",
			label: `Город: ${cityFilterValue}`,
			clearParams: { cityFilter: null },
		});
	}

	const roleFilterValue = searchParams.get("role");
	const roleLabel = getRoleFilterLabel(roleFilterValue);
	if (roleLabel) {
		activeFilters.push({
			id: "role",
			label: `Роль: ${roleLabel}`,
			clearParams: { role: null },
		});
	}

	const verifiedFilterValue = searchParams.get("verified");
	if (verifiedFilterValue === "yes") {
		activeFilters.push({
			id: "verified_yes",
			label: "Подтверждён: да",
			clearParams: { verified: null },
		});
	}
	if (verifiedFilterValue === "no") {
		activeFilters.push({
			id: "verified_no",
			label: "Подтверждён: нет",
			clearParams: { verified: null },
		});
	}

	const createdFromValue = searchParams.get("createdFrom");
	const createdToValue = searchParams.get("createdTo");
	if (createdFromValue || createdToValue) {
		let label = "Создан: ";
		if (createdFromValue && createdToValue) {
			label += `с ${createdFromValue} по ${createdToValue}`;
		} else if (createdFromValue) {
			label += `с ${createdFromValue}`;
		} else if (createdToValue) {
			label += `по ${createdToValue}`;
		}
		activeFilters.push({
			id: "createdRange",
			label,
			clearParams: { createdFrom: null, createdTo: null },
		});
	}

	// Текущая сортировка — всегда есть хотя бы дефолтная.
	const activeSortLabel = `Сортировка: ${getSortFieldLabel(sortField)} (${getSortDirectionLabel(sortDirection)})`;

	// Отключение одного фильтра из панели "Активные фильтры".
	const handleRemoveActiveFilter = (filter: ActiveFilter) => {
		// Сначала чистим query-параметры.
		handleFiltersChange(filter.clearParams);

		// Затем синхронизируем локальное состояние полей фильтров, чтобы они визуально очистились.
		setColumnFilters((prev) => {
			const next = { ...prev };

			if (filter.clearParams.idFilter === null) next.idFilter = "";
			if (filter.clearParams.emailFilter === null) next.emailFilter = "";
			if (filter.clearParams.fioFilter === null) next.fioFilter = "";
			if (filter.clearParams.phoneFilter === null) next.phoneFilter = "";
			if (filter.clearParams.cityFilter === null) next.cityFilter = "";

			if (filter.clearParams.createdFrom === null) next.createdFromUi = "";
			if (filter.clearParams.createdTo === null) next.createdToUi = "";

			return next;
		});
	};

	// Расчёт данных для отрисовки календаря.
	const getCalendarMatrix = () => {
		// 0 (Пн) - 6 (Вс)
		const firstDay = new Date(calendarYear, calendarMonth, 1);
		const firstWeekDayRaw = firstDay.getDay(); // 0 (Вс) - 6 (Сб)
		const firstWeekDay = (firstWeekDayRaw + 6) % 7; // приводим к Пн=0
		const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

		const weeks: (number | null)[][] = [];
		let currentDay = 1;

		// Максимум 6 недель в месяце.
		for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
			const week: (number | null)[] = [];
			for (let weekDay = 0; weekDay < 7; weekDay += 1) {
				if (weekIndex === 0 && weekDay < firstWeekDay) {
					week.push(null);
				} else if (currentDay > daysInMonth) {
					week.push(null);
				} else {
					week.push(currentDay);
					currentDay += 1;
				}
			}
			// Если неделя полностью пустая — не добавляем.
			if (week.every((day) => day === null)) break;
			weeks.push(week);
		}

		return weeks;
	};

	const calendarWeeks = getCalendarMatrix();

	// Обработка клика по дню в календаре.
	const handleSelectCalendarDay = (day: number | null) => {
		if (!day || !activeDateField) return;
		const selected = new Date(calendarYear, calendarMonth, day);
		const uiValue = formatDateToUi(selected);
		const isoValue = parseUiDateToIso(uiValue);

		if (!isoValue) return;

		if (activeDateField === "from") {
			setColumnFilters((prev) => ({ ...prev, createdFromUi: uiValue }));
			handleFiltersChange({ createdFrom: isoValue });
		} else {
			setColumnFilters((prev) => ({ ...prev, createdToUi: uiValue }));
			handleFiltersChange({ createdTo: isoValue });
		}

		setIsCalendarOpen(false);
		setActiveDateField(null);
	};

	const handleOpenCalendarForField = (field: "from" | "to") => {
		setActiveDateField(field);
		setIsCalendarOpen(true);

		const sourceValue = field === "from" ? columnFilters.createdFromUi : columnFilters.createdToUi;
		const iso = parseUiDateToIso(sourceValue);
		if (iso) {
			const [yyyy, mm, dd] = iso.split("-").map((part) => Number(part));
			if (yyyy && mm && dd) {
				setCalendarYear(yyyy);
				setCalendarMonth(mm - 1);
				return;
			}
		}
		// Если даты нет или формат неверный — открываем текущий месяц.
		setCalendarYear(today.getFullYear());
		setCalendarMonth(today.getMonth());
	};

	const handleChangeMonth = (delta: number) => {
		let newMonth = calendarMonth + delta;
		let newYear = calendarYear;
		if (newMonth > 11) {
			newMonth = 0;
			newYear += 1;
		} else if (newMonth < 0) {
			newMonth = 11;
			newYear -= 1;
		}
		setCalendarMonth(newMonth);
		setCalendarYear(newYear);
	};

	const handleChangeYear = (delta: number) => {
		setCalendarYear((prev) => prev + delta);
	};

	const monthNamesShort = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

	return (
		// Здесь используем общие стили таблиц админки,
		// чтобы аналогичные таблицы (пользователи, заказы и т.п.) выглядели одинаково.
		<div className={styles.adminTableWrapper}>
			{/* Список активных фильтров и текущей сортировки над таблицей. */}
			<div className={styles.adminFiltersPanel}>
				<div className={styles.adminFiltersPanelHeader}>
					<div className={styles.adminFiltersPanelTitle}>Активные фильтры</div>
					<div className={styles.adminFiltersList}>
						{activeFilters.map((filter) => (
							<button type="button" key={filter.id} className={styles.adminFiltersChip} onClick={() => handleRemoveActiveFilter(filter)}>
								{filter.label}
							</button>
						))}
						<span className={styles.adminSortChip}>{activeSortLabel}</span>
					</div>
				</div>
				<button
					type="button"
					className={styles.adminTableActionButton + " " + styles.adminFiltersClearButton}
					onClick={handleClearAllFilters}
					disabled={activeFilters.length === 0}
				>
					Очистить фильтры
				</button>
			</div>

			<table className={styles.adminTable}>
				<thead>
					<tr>
						<th>ID</th>
						<th>Почта</th>
						<th>ФИО</th>
						<th>Телефон</th>
						<th>Город</th>
						<th>Роль</th>
						<th>Подтверждён</th>
						<th>Создан</th>
						<th>Действия</th>
					</tr>
					<tr>
						{/* Строка фильтров прямо в шапке таблицы. */}
						<th>
							<input
								type="text"
								value={columnFilters.idFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										idFilter: event.target.value,
									}))
								}
								placeholder="Поиск по ID"
							/>
						</th>
						<th>
							<input
								type="text"
								value={columnFilters.emailFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										emailFilter: event.target.value,
									}))
								}
								placeholder="Поиск по почте"
							/>
						</th>
						<th>
							<input
								type="text"
								value={columnFilters.fioFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										fioFilter: event.target.value,
									}))
								}
								placeholder="Поиск по ФИО"
							/>
						</th>
						<th>
							<input
								type="text"
								value={columnFilters.phoneFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										phoneFilter: event.target.value,
									}))
								}
								placeholder="Поиск по телефону"
							/>
						</th>
						<th>
							<input
								type="text"
								value={columnFilters.cityFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										cityFilter: event.target.value,
									}))
								}
								placeholder="Поиск по городу"
							/>
						</th>
						<th>
							<select
								value={searchParams.get("role") || ""}
								onChange={(event) => {
									const value = event.target.value;
									handleFiltersChange({ role: value || null });
								}}
							>
								<option value="">Все роли</option>
								<option value="user">Пользователь</option>
								<option value="admin">Администратор</option>
								<option value="super">Суперадминистратор</option>
							</select>
						</th>
						<th>
							<select
								value={searchParams.get("verified") || ""}
								onChange={(event) => {
									const value = event.target.value;
									handleFiltersChange({ verified: value || null });
								}}
							>
								<option value="">Все</option>
								<option value="yes">Только подтверждённые</option>
								<option value="no">Только неподтверждённые</option>
							</select>
						</th>
						<th>
							{/* Кастомный блок диапазона дат "От — До" в одном поле. */}
							<div ref={dateRangeRef} className={styles.adminDateRangeWrapper}>
								<div className={styles.adminDateRange}>
									<input
										type="text"
										className={styles.adminDateInput}
										placeholder="От"
										value={columnFilters.createdFromUi}
										onChange={(event) =>
											setColumnFilters((prev) => ({
												...prev,
												createdFromUi: event.target.value,
											}))
										}
										onFocus={() => handleOpenCalendarForField("from")}
									/>
									<span className={styles.adminDateSeparator}>—</span>
									<input
										type="text"
										className={styles.adminDateInput}
										placeholder="До"
										value={columnFilters.createdToUi}
										onChange={(event) =>
											setColumnFilters((prev) => ({
												...prev,
												createdToUi: event.target.value,
											}))
										}
										onFocus={() => handleOpenCalendarForField("to")}
									/>
								</div>

								{isCalendarOpen && (
									<div className={styles.adminDatePicker}>
										<div className={styles.adminDatePickerHeader}>
											<button type="button" className={styles.adminTableActionButton} onClick={() => handleChangeYear(-1)}>
												{"<<"}
											</button>
											<button type="button" className={styles.adminTableActionButton} onClick={() => handleChangeMonth(-1)}>
												{"<"}
											</button>
											<div className={styles.adminDatePickerTitle}>
												{monthNamesShort[calendarMonth]} {calendarYear}
											</div>
											<button type="button" className={styles.adminTableActionButton} onClick={() => handleChangeMonth(1)}>
												{">"}
											</button>
											<button type="button" className={styles.adminTableActionButton} onClick={() => handleChangeYear(1)}>
												{">>"}
											</button>
										</div>
										<table className={styles.adminDatePickerTable}>
											<thead>
												<tr>
													{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
														<th key={day}>{day}</th>
													))}
												</tr>
											</thead>
											<tbody>
												{calendarWeeks.map((week, weekIndex) => (
													<tr key={weekIndex}>
														{week.map((day, dayIndex) => (
															<td key={dayIndex}>
																{day ? (
																	<button type="button" className={styles.adminDatePickerDayButton} onClick={() => handleSelectCalendarDay(day)}>
																		{day}
																	</button>
																) : (
																	<span className={styles.adminDatePickerEmptyCell} />
																)}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{list.length === 0 ? (
						<tr className={styles.adminTableRow}>
							{/* Если пользователей нет, показываем понятное сообщение прямо внутри таблицы. */}
							<td colSpan={9}>Пользователи отсутствуют</td>
						</tr>
					) : (
						list.map((user) => (
							<tr key={user._id} className={styles.adminTableRow}>
								{/* Показываем человекочитаемый ID (publicId), а при его отсутствии — технический _id. */}
								<td>{user.publicId || user._id}</td>
								<td>{user.email}</td>
								<td>{getFullName(user)}</td>
								<td>{user.phone1}</td>
								<td>{user.city || "Город не указан"}</td>
								<td>{getUserRoleLabel(user)}</td>
								<td>{user.isVerifiedByAdmin ? "Да" : "Нет"}</td>
								<td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}</td>
								<td>
									<div className={styles.adminTableActionsRow}>
										<Link href={`/admin/users/${user.publicId || user._id}`} className={styles.adminTableActionButton}>
											Редактировать
										</Link>
										<button
											type="button"
											className={styles.adminTableActionButton + " " + styles.adminTableActionDanger}
											onClick={(event) => handleDeleteUser(event, user.publicId || user._id)}
											disabled={deletingId === (user.publicId || user._id)}
										>
											{deletingId === user._id ? "Удаляем..." : "Удалить"}
										</button>
										<Link href={`/admin/users/${user.publicId || user._id}/addresses`} className={styles.adminTableActionButton}>
											Адреса
										</Link>
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>

			{/* Простая постраничная навигация под таблицей.
			    Здесь нет сложной логики, но уже сейчас мы не грузим тысячи пользователей за один раз. */}
			{totalPages > 1 && (
				<div className={styles.adminTableFooter}>
					<button type="button" className={styles.adminTableActionButton} onClick={() => handleChangePage(page - 1)} disabled={page <= 1}>
						Назад
					</button>
					<div className={styles.adminTableDate}>
						Страница {page} из {totalPages}
					</div>
					<button type="button" className={styles.adminTableActionButton} onClick={() => handleChangePage(page + 1)} disabled={page >= totalPages}>
						Вперёд
					</button>
				</div>
			)}
		</div>
	);
}
