"use client";

import { useState, useEffect, useRef } from "react";

// Тип для заказа в результатах поиска
export type OrderSearchResult = {
	_id: string;
	orderId: string;
	track: string;
	weight: number;
	status: string;
	type: "order" | "group"; // Тип: отдельный заказ или объединённая группа
	groupId?: string; // Для групп
	ordersCount?: number; // Количество заказов в группе
	orderIds?: string[]; // Все orderId из группы (для групп)
};

type OrderSearchProps = {
	value: OrderSearchResult[];
	onChange: (orders: OrderSearchResult[]) => void;
	error?: string;
	title?: string;
};

export default function OrderSearch({ value, onChange, error, title }: OrderSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState<OrderSearchResult[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Закрываем выпадающий список при клике вне компонента
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Поиск заказов с задержкой (debounce)
	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		if (searchQuery.trim().length === 0) {
			setResults([]);
			setIsOpen(false);
			return;
		}

		// Ждём 300мс после последнего ввода перед поиском
		searchTimeoutRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const response = await fetch(`/api/admin/orders/search?q=${encodeURIComponent(searchQuery.trim())}`);
				if (response.ok) {
					const data = await response.json();
					// Объединяем заказы и группы в один массив результатов
					const allResults: OrderSearchResult[] = [...(data.orders || []), ...(data.groups || [])];
					// Фильтруем результаты, которые уже выбраны
					// Для заказов проверяем по _id, для групп - по groupId
					const selectedOrderIds = new Set(value.filter((o) => o.type === "order").map((o) => o._id));
					const selectedGroupIds = new Set(
						value
							.filter((o) => o.type === "group")
							.map((o) => o.groupId)
							.filter(Boolean)
					);
					const filteredResults = allResults.filter((item: OrderSearchResult) => {
						if (item.type === "order") {
							return !selectedOrderIds.has(item._id);
						} else if (item.type === "group") {
							return !selectedGroupIds.has(item.groupId);
						}
						return true;
					});
					setResults(filteredResults);
					setIsOpen(filteredResults.length > 0);
				}
			} catch (error) {
				console.error("Ошибка поиска заказов:", error);
			} finally {
				setLoading(false);
			}
		}, 300);

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchQuery, value]);

	const handleSelectOrder = (item: OrderSearchResult) => {
		// Если выбрана группа, добавляем все заказы из группы
		if (item.type === "group" && item.groupId && item.orderIds && item.orderIds.length > 0) {
			// Создаём объекты заказов для каждого orderId из группы
			const ordersCount = item.orderIds.length;
			const groupOrders: OrderSearchResult[] = item.orderIds.map((orderId) => ({
				_id: `group_${item.groupId}_${orderId}`, // Уникальный ID для заказа из группы
				orderId: orderId,
				track: `Группа ${item.groupId}`,
				weight: ordersCount > 0 ? item.weight / ordersCount : 0, // Распределяем вес равномерно
				status: item.status,
				type: "order" as const,
			}));
			onChange([...value, ...groupOrders]);
		} else {
			// Если выбран отдельный заказ, добавляем его
			onChange([...value, item]);
		}
		setSearchQuery("");
		setResults([]);
		setIsOpen(false);
	};

	const handleRemoveOrder = (itemId: string) => {
		onChange(value.filter((item) => item._id !== itemId));
	};

	return (
		<div className="formField" ref={containerRef} style={{ position: "relative" }}>
			{title && <div className="formFieldTitle">{title}</div>}

			{/* Поле поиска */}
			<input
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				onFocus={() => {
					if (results.length > 0) setIsOpen(true);
				}}
				placeholder="Введите ID заказа или группы для поиска..."
				className={`formBaseInput ${error ? "error" : ""}`}
				style={error ? { outline: "1px solid var(--color-f-error, #ff3737)" } : undefined}
			/>
			{loading && <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Поиск...</div>}

			{/* Выпадающий список результатов */}
			{isOpen && results.length > 0 && (
				<div
					style={{
						position: "absolute",
						top: "100%",
						left: 0,
						right: 0,
						background: "white",
						border: "1px solid #e0e0e0",
						borderRadius: "4px",
						boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
						zIndex: 1000,
						maxHeight: "300px",
						overflowY: "auto",
						marginTop: "4px",
					}}
				>
					{results.map((item) => (
						<div
							key={item._id}
							onClick={() => handleSelectOrder(item)}
							style={{
								padding: "12px",
								cursor: "pointer",
								borderBottom: "1px solid #f0f0f0",
								background: item.type === "group" ? "#e3f2fd" : "white",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = item.type === "group" ? "#bbdefb" : "#f5f5f5";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = item.type === "group" ? "#e3f2fd" : "white";
							}}
						>
							<div style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
								{item.type === "group" && <span style={{ fontSize: "12px", color: "#1976d2" }}>📦</span>}
								{item.type === "group" ? `Группа ${item.groupId}` : `ID: ${item.orderId}`}
								{item.type === "group" && <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>({item.ordersCount} заказов)</span>}
							</div>
							<div style={{ fontSize: "14px", color: "#666" }}>
								{item.type === "group" ? (
									<>
										Заказов: {item.ordersCount} | Общий вес: {item.weight.toFixed(2)} кг
									</>
								) : (
									<>
										Трек: {item.track} | Вес: {item.weight} кг
									</>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Список выбранных заказов */}
			{value.length > 0 && (
				<div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
					<div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>Выбранные заказы:</div>
					{value.map((order) => (
						<div
							key={order._id}
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								padding: "8px 12px",
								background: "#f5f5f5",
								borderRadius: "4px",
							}}
						>
							<div>
								<div style={{ fontWeight: "600" }}>ID: {order.orderId}</div>
								<div style={{ fontSize: "12px", color: "#666" }}>
									Трек: {order.track} | Вес: {order.weight} кг
								</div>
							</div>
							<button
								type="button"
								onClick={() => handleRemoveOrder(order._id)}
								style={{
									padding: "4px 8px",
									background: "#d32f2f",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: "pointer",
									fontSize: "12px",
								}}
							>
								Удалить
							</button>
						</div>
					))}
				</div>
			)}

			{error && <div className="formFieldError">{error}</div>}
		</div>
	);
}
