"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/components/admin/AdminTable.module.scss";
import { IOrder, StatusEnToRu } from "@/mongodb/models/orderModel";
import { getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from "@/helpers/dateHelpers";

type AdminOrdersListProps = {
	orders: IOrder[];
	// Номер текущей страницы, получаем от сервера.
	page: number;
	// Общее количество страниц.
	totalPages: number;
	// Поле сортировки и направление.
	sortField: "createdAt" | "status" | "orderId" | "track";
	sortDirection: "asc" | "desc";
};

// Таблица заказов для администратора.
// Логика похожа на AdminUsersList, но упрощена: только базовые фильтры.
export default function AdminOrdersList({ orders, page, totalPages, sortField, sortDirection }: AdminOrdersListProps) {
	const [list, setList] = useState<IOrder[]>(orders);
	// Состояние для выбранных заказов (чекбоксы)
	const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

	// Фильтры по колонкам.
	const [columnFilters, setColumnFilters] = useState<{
		orderIdFilter: string;
		externalIdFilter: string;
		trackFilter: string;
		groupIdFilter: string;
		cityFilter: string;
		shopFilter: string;
		shelfFilter: string;
		weightFromUi: string;
		weightToUi: string;
		createdFromUi: string;
		createdToUi: string;
	}>({
		orderIdFilter: "",
		externalIdFilter: "",
		trackFilter: "",
		groupIdFilter: "",
		cityFilter: "",
		shopFilter: "",
		shelfFilter: "",
		weightFromUi: "",
		weightToUi: "",
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

	// Флаг для отслеживания, была ли выполнена инициализация значений по умолчанию
	const hasInitializedDefaults = useRef(false);

	// Синхронизируем локальный список с пропами при изменении данных с сервера.
	useEffect(() => {
		setList(orders);
	}, [orders]);

	// При изменении URL подтягиваем значения фильтров в инпуты.
	useEffect(() => {
		setColumnFilters({
			orderIdFilter: searchParams.get("orderIdFilter") || "",
			externalIdFilter: searchParams.get("externalOrderIdFilter") || "",
			trackFilter: searchParams.get("trackFilter") || "",
			groupIdFilter: searchParams.get("groupIdFilter") || "",
			cityFilter: searchParams.get("cityFilter") || "",
			shopFilter: searchParams.get("shopFilter") || "",
			shelfFilter: searchParams.get("shelfFilter") || "",
			weightFromUi: searchParams.get("weightFrom") || "",
			weightToUi: searchParams.get("weightTo") || "",
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
				orderIdFilter: columnFilters.orderIdFilter.trim() || null,
				externalOrderIdFilter: columnFilters.externalIdFilter.trim() || null,
				trackFilter: columnFilters.trackFilter.trim() || null,
				groupIdFilter: columnFilters.groupIdFilter.trim() || null,
				cityFilter: columnFilters.cityFilter.trim() || null,
				shopFilter: columnFilters.shopFilter.trim() || null,
			};
			handleFiltersChange(updates);
		}, 500);

		return () => {
			window.clearTimeout(timeoutId);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [columnFilters.orderIdFilter, columnFilters.externalIdFilter, columnFilters.trackFilter, columnFilters.groupIdFilter, columnFilters.cityFilter, columnFilters.shopFilter]);

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

	// Небольшой помощник: собираем строку query-параметров.
	const buildUpdatedQuery = (updates: Record<string, string | null>, resetPageIfNotProvided = false) => {
		const params = new URLSearchParams(searchParams.toString());

		Object.entries(updates).forEach(([key, value]) => {
			if (value === null || value === "") {
				params.delete(key);
			} else {
				params.set(key, value);
			}
		});

		if (resetPageIfNotProvided && !Object.prototype.hasOwnProperty.call(updates, "page")) {
			params.delete("page");
		}

		return params.toString();
	};

	const handleChangePage = (nextPage: number) => {
		if (nextPage < 1 || nextPage > totalPages) return;
		const query = buildUpdatedQuery({ page: String(nextPage) }, false);
		router.push(query ? `/admin/orders?${query}` : "/admin/orders");
	};

	// Применяем фильтры: всегда сбрасываем страницу на первую.
	const handleFiltersChange = (updates: Record<string, string | null>) => {
		const query = buildUpdatedQuery(updates, true);
		router.push(query ? `/admin/orders?${query}` : "/admin/orders");
	};

	// Устанавливаем значения по умолчанию для фильтров дат при первой загрузке, если их нет в URL
	useEffect(() => {
		// Проверяем, есть ли уже параметры дат в URL
		const hasCreatedFrom = searchParams.has("createdFrom");
		const hasCreatedTo = searchParams.has("createdTo");

		// Если параметров нет и мы ещё не инициализировали значения по умолчанию
		if (!hasCreatedFrom && !hasCreatedTo && !hasInitializedDefaults.current) {
			hasInitializedDefaults.current = true;
			const defaultDateFrom = getFirstDayOfCurrentMonth();
			const defaultDateTo = getLastDayOfCurrentMonth();
			handleFiltersChange({
				createdFrom: defaultDateFrom,
				createdTo: defaultDateTo,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Собираем "активные" фильтры для панели над таблицей.
	type ActiveFilter = {
		id: string;
		label: string;
		clearParams: Record<string, string | null>;
	};

	const activeFilters: ActiveFilter[] = [];

	const orderIdValue = searchParams.get("orderIdFilter");
	if (orderIdValue) {
		activeFilters.push({
			id: "orderIdFilter",
			label: `Номер заказа: ${orderIdValue}`,
			clearParams: { orderIdFilter: null },
		});
	}

	const externalIdValue = searchParams.get("externalOrderIdFilter");
	if (externalIdValue) {
		activeFilters.push({
			id: "externalOrderIdFilter",
			label: `Внешний ID: ${externalIdValue}`,
			clearParams: { externalOrderIdFilter: null },
		});
	}

	const trackValue = searchParams.get("trackFilter");
	if (trackValue) {
		activeFilters.push({
			id: "trackFilter",
			label: `Трек: ${trackValue}`,
			clearParams: { trackFilter: null },
		});
	}

	const groupIdValue = searchParams.get("groupIdFilter");
	if (groupIdValue) {
		activeFilters.push({
			id: "groupIdFilter",
			label: `ID группы: ${groupIdValue}`,
			clearParams: { groupIdFilter: null },
		});
	}

	const cityValue = searchParams.get("cityFilter");
	if (cityValue) {
		activeFilters.push({
			id: "cityFilter",
			label: `Город: ${cityValue}`,
			clearParams: { cityFilter: null },
		});
	}

	const shopValue = searchParams.get("shopFilter");
	if (shopValue) {
		activeFilters.push({
			id: "shopFilter",
			label: `Магазин / отправитель: ${shopValue}`,
			clearParams: { shopFilter: null },
		});
	}

	const shelfValue = searchParams.get("shelfFilter");
	if (shelfValue) {
		activeFilters.push({
			id: "shelfFilter",
			label: `Полка на складе: ${shelfValue}`,
			clearParams: { shelfFilter: null },
		});
	}

	const shipmentMethodValue = searchParams.get("shipmentMethodFilter");
	if (shipmentMethodValue === "warehouse" || shipmentMethodValue === "courier") {
		activeFilters.push({
			id: "shipmentMethodFilter",
			label: shipmentMethodValue === "warehouse" ? "Доставка до склада" : "Курьер до двери",
			clearParams: { shipmentMethodFilter: null },
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

	const weightFromValue = searchParams.get("weightFrom");
	const weightToValue = searchParams.get("weightTo");
	if (weightFromValue || weightToValue) {
		let label = "Вес: ";
		if (weightFromValue && weightToValue) {
			label += `от ${weightFromValue} до ${weightToValue} кг`;
		} else if (weightFromValue) {
			label += `от ${weightFromValue} кг`;
		} else if (weightToValue) {
			label += `до ${weightToValue} кг`;
		}
		activeFilters.push({
			id: "weightRange",
			label,
			clearParams: { weightFrom: null, weightTo: null },
		});
	}

	const formTypeValue = searchParams.get("formTypeFilter");
	if (formTypeValue === "person" || formTypeValue === "business") {
		activeFilters.push({
			id: "formTypeFilter",
			label: formTypeValue === "business" ? "Бизнес" : "Физлицо",
			clearParams: { formTypeFilter: null },
		});
	}

	const paidStatusValue = searchParams.get("paidStatusFilter");
	if (paidStatusValue === "not_paid" || paidStatusValue === "partial" || paidStatusValue === "full") {
		const labelMap: Record<string, string> = {
			not_paid: "Счёт: не оплачен",
			partial: "Счёт: частично оплачен",
			full: "Счёт: полностью оплачен",
		};
		activeFilters.push({
			id: "paidStatusFilter",
			label: labelMap[paidStatusValue],
			clearParams: { paidStatusFilter: null },
		});
	}

	const departmentFromValue = searchParams.get("departmentFromId");
	if (departmentFromValue) {
		activeFilters.push({
			id: "departmentFromId",
			label: `Department From: ${departmentFromValue}`,
			clearParams: { departmentFromId: null },
		});
	}

	const departmentToValue = searchParams.get("departmentToId");
	if (departmentToValue) {
		activeFilters.push({
			id: "departmentToId",
			label: `Department To: ${departmentToValue}`,
			clearParams: { departmentToId: null },
		});
	}

	const statusValue = searchParams.get("statusFilter") as IOrder["status"] | null;
	if (statusValue) {
		activeFilters.push({
			id: "statusFilter",
			label: `Статус: ${StatusEnToRu[statusValue]}`,
			clearParams: { statusFilter: null },
		});
	}

	const getSortFieldLabel = (field: AdminOrdersListProps["sortField"]) => {
		if (field === "status") return "Статус";
		if (field === "orderId") return "Номер заказа";
		if (field === "track") return "Трек-номер";
		return "Дата создания";
	};

	const getSortDirectionLabel = (direction: AdminOrdersListProps["sortDirection"]) => {
		return direction === "asc" ? "по возрастанию" : "по убыванию";
	};

	const activeSortLabel = `Сортировка: ${getSortFieldLabel(sortField)} (${getSortDirectionLabel(sortDirection)})`;

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

	const handleRemoveActiveFilter = (filter: ActiveFilter) => {
		handleFiltersChange(filter.clearParams);

		setColumnFilters((prev) => {
			const next = { ...prev };

			if (filter.clearParams.orderIdFilter === null) next.orderIdFilter = "";
			if (filter.clearParams.externalOrderIdFilter === null) next.externalIdFilter = "";
			if (filter.clearParams.trackFilter === null) next.trackFilter = "";
			if (filter.clearParams.groupIdFilter === null) next.groupIdFilter = "";
			if (filter.clearParams.cityFilter === null) next.cityFilter = "";

			if (filter.clearParams.shopFilter === null) next.shopFilter = "";
			if (filter.clearParams.shelfFilter === null) next.shelfFilter = "";

			if (filter.clearParams.weightFrom === null) next.weightFromUi = "";
			if (filter.clearParams.weightTo === null) next.weightToUi = "";

			if (filter.clearParams.createdFrom === null) next.createdFromUi = "";
			if (filter.clearParams.createdTo === null) next.createdToUi = "";

			return next;
		});
	};

	const handleClearAllFilters = () => {
		setColumnFilters({
			orderIdFilter: "",
			externalIdFilter: "",
			trackFilter: "",
			groupIdFilter: "",
			cityFilter: "",
			shopFilter: "",
			shelfFilter: "",
			weightFromUi: "",
			weightToUi: "",
			createdFromUi: "",
			createdToUi: "",
		});

		handleFiltersChange({
			orderIdFilter: null,
			externalOrderIdFilter: null,
			trackFilter: null,
			groupIdFilter: null,
			cityFilter: null,
			statusFilter: null,
			createdFrom: null,
			createdTo: null,
			shipmentMethodFilter: null,
			shopFilter: null,
			shelfFilter: null,
			weightFrom: null,
			weightTo: null,
			formTypeFilter: null,
			paidStatusFilter: null,
			departmentFromId: null,
			departmentToId: null,
		});
	};

	const handleChangeSort = (field: AdminOrdersListProps["sortField"]) => {
		let nextDirection: AdminOrdersListProps["sortDirection"] = "asc";
		if (field === sortField) {
			nextDirection = sortDirection === "asc" ? "desc" : "asc";
		}

		const query = buildUpdatedQuery(
			{
				sortField: field,
				sortDirection: nextDirection,
			},
			true
		);

		router.push(query ? `/admin/orders?${query}` : "/admin/orders");
	};

	const renderSortButton = (field: AdminOrdersListProps["sortField"]) => {
		const isActive = sortField === field;
		const arrow = !isActive ? "↕" : sortDirection === "asc" ? "↑" : "↓";

		return (
			<button type="button" className={styles.adminTableSortButton} onClick={() => handleChangeSort(field)}>
				{arrow}
			</button>
		);
	};

	// Вычисляем человекочитаемый статус оплаты для колонки.
	const getPaymentStatusLabel = (order: IOrder) => {
		const hasOrderCoast = typeof order.order_coast === "number" && order.order_coast > 0;
		const hasPaid = typeof order.paid === "number" && order.paid > 0;

		if (!hasOrderCoast && !hasPaid) return "—";

		if (!hasPaid) return "Не оплачен";

		if (hasOrderCoast && order.paid! < order.order_coast!) {
			return "Частично оплачен";
		}

		if (hasOrderCoast && order.paid! >= order.order_coast!) {
			return "Полностью оплачен";
		}

		// Запасной вариант, если что-то пошло не так.
		return "Оплата есть";
	};

	// Обработчик выбора/снятия выбора заказа
	const handleToggleOrder = (orderId: string) => {
		setSelectedOrders((prev) => {
			const next = new Set(prev);
			if (next.has(orderId)) {
				next.delete(orderId);
			} else {
				next.add(orderId);
			}
			return next;
		});
	};

	// Обработчик выбора всех заказов на странице
	const handleSelectAll = () => {
		if (selectedOrders.size === list.length) {
			// Если все выбраны, снимаем выбор
			setSelectedOrders(new Set());
		} else {
			// Выбираем все заказы на текущей странице
			setSelectedOrders(new Set(list.map((order) => order._id || "").filter(Boolean)));
		}
	};

	// Обработчик сброса выбора
	const handleResetSelection = () => {
		setSelectedOrders(new Set());
	};

	// Обработчик объединения заказов
	const handleCombineOrders = async () => {
		const selectedIds = Array.from(selectedOrders);
		if (selectedIds.length < 2) {
			alert("Нужно выбрать минимум два заказа для объединения.");
			return;
		}

		try {
			const res = await fetch("/api/orders/merge", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderIds: selectedIds }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message || "Ошибка объединения");
			alert("Заказы объединены");
			// Сбрасываем выбор и обновляем страницу
			setSelectedOrders(new Set());
			router.refresh();
		} catch (error: any) {
			alert(error.message || "Ошибка объединения заказов");
		}
	};

	return (
		<div className={styles.adminTableWrapper}>
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

			{/* Панель с кнопками объединения заказов */}
			{selectedOrders.size > 0 && (
				<div className={styles.adminTableActionsRowTop}>
					<button type="button" className={styles.adminTableActionButton} onClick={handleCombineOrders} disabled={selectedOrders.size < 2}>
						Объединить ({selectedOrders.size})
					</button>
					<button type="button" className={styles.adminTableActionButton} onClick={handleResetSelection}>
						Сбросить
					</button>
				</div>
			)}
			<table className={styles.adminTable}>
				<thead>
					<tr>
						{/* Колонка с чекбоксом для выбора всех заказов */}
						<th>
							<div className={styles.adminTableHeaderCell}>
								<input
									type="checkbox"
									checked={list.length > 0 && selectedOrders.size === list.length}
									onChange={handleSelectAll}
									title="Выбрать все заказы на странице"
								/>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>ID группы</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Номер на американском сайте</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Номер заказа</span>
								{renderSortButton("orderId")}
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Трек-номер</span>
								{renderSortButton("track")}
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Полка на складе</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Описание</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Город получателя</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Магазин / отправитель</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Статус оплаты</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Вложения</span>
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Статус</span>
								{renderSortButton("status")}
							</div>
						</th>
						<th>
							<div className={styles.adminTableHeaderCell}>
								<span>Дата создания</span>
								{renderSortButton("createdAt")}
							</div>
						</th>
						<th>Действия</th>
					</tr>
					<tr>
						{/* Пустая ячейка под чекбоксом выбора всех */}
						<th />
						<th>
							<input
								type="text"
								value={columnFilters.groupIdFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										groupIdFilter: event.target.value,
									}))
								}
								placeholder="Поиск по ID группы"
							/>
						</th>
						<th>
							<input
								type="text"
								value={columnFilters.externalIdFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										externalIdFilter: event.target.value,
									}))
								}
								placeholder="Поиск по внешнему ID"
							/>
						</th>
						<th>
							<input
								type="text"
								value={columnFilters.orderIdFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										orderIdFilter: event.target.value,
									}))
								}
								placeholder="Поиск по номеру заказа"
							/>
						</th>
						<th>
							<input
								type="text"
								value={columnFilters.trackFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										trackFilter: event.target.value,
									}))
								}
								placeholder="Поиск по треку"
							/>
						</th>
						<th>{/* Полка пока только выводится, фильтр добавим при необходимости. */}</th>
						{/* Колонка "Описание" пока без фильтра. */}
						<th />
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
							<input
								type="text"
								value={columnFilters.shopFilter}
								onChange={(event) =>
									setColumnFilters((prev) => ({
										...prev,
										shopFilter: event.target.value,
									}))
								}
								placeholder="Поиск по магазину"
							/>
						</th>
						{/* Фильтр по статусу оплаты */}
						<th>
							<select
								value={searchParams.get("paidStatusFilter") || ""}
								onChange={(event) => {
									const value = event.target.value;
									handleFiltersChange({ paidStatusFilter: value || null });
								}}
							>
								<option value="">Любой статус оплаты</option>
								<option value="not_paid">Не оплачен</option>
								<option value="partial">Частично оплачен</option>
								<option value="full">Полностью оплачен</option>
							</select>
						</th>
						{/* Колонка "Вложения" пока без фильтра. */}
						<th />
						{/* Фильтр по статусу заказа */}
						<th>
							<select
								value={searchParams.get("statusFilter") || ""}
								onChange={(event) => {
									const value = event.target.value;
									handleFiltersChange({ statusFilter: value || null });
								}}
							>
								<option value="">Все статусы</option>
								{Object.keys(StatusEnToRu).map((statusKey) => (
									<option key={statusKey} value={statusKey}>
										{StatusEnToRu[statusKey as IOrder["status"]]}
									</option>
								))}
							</select>
						</th>
						{/* Колонка "Дата создания" с фильтром по дате. */}
						<th>
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
													<th>Пн</th>
													<th>Вт</th>
													<th>Ср</th>
													<th>Чт</th>
													<th>Пт</th>
													<th>Сб</th>
													<th>Вс</th>
												</tr>
											</thead>
											<tbody>
												{calendarWeeks.map((week, weekIndex) => (
													<tr key={weekIndex}>
														{week.map((day, dayIndex) => (
															<td
																key={dayIndex}
																className={day ? styles.adminDatePickerDay : styles.adminDatePickerDayEmpty}
																onClick={() => handleSelectCalendarDay(day)}
															>
																{day}
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
							<td colSpan={14}>Заказы отсутствуют</td>
						</tr>
					) : (
						list.map((order) => {
							const attachmentsCount = order.attachments?.length || 0;
							const orderId = order._id || "";
							const isSelected = selectedOrders.has(orderId);

							return (
								<tr key={order._id} className={styles.adminTableRow}>
									{/* Чекбокс для выбора заказа */}
									<td>
										<input type="checkbox" checked={isSelected} onChange={() => handleToggleOrder(orderId)} title="Выбрать заказ для объединения" />
									</td>
									<td>{order.groupId || "—"}</td>
									<td>{order.externalOrderId || "—"}</td>
									<td>{order.orderId ? `№${order.orderId}` : "—"}</td>
									<td>{order.track}</td>
									<td>{order.shelf || "—"}</td>
									<td>{order.description}</td>
									<td>{order.adressSnapshot?.city || "—"}</td>
									<td>{order.shopUrl}</td>
									<td>{getPaymentStatusLabel(order)}</td>
									<td>{attachmentsCount > 0 ? `${attachmentsCount} шт.` : "нет"}</td>
									<td>{StatusEnToRu[order.status]}</td>
									<td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}</td>
									<td>
										<div className={styles.adminTableActionsRow}>
											<Link
												href={`/admin/orders/${order.orderId && String(order.orderId).trim().length > 0 ? String(order.orderId) : order._id}`}
												className={styles.adminTableActionButton}
											>
												Открыть
											</Link>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>

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
