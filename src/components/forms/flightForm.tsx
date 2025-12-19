"use client";

import { useForm } from "react-hook-form";
import { Input } from "../ui/FormElements/Input";
import { FlightFormData, flightSchema } from "@/helpers/zod/validateZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { redirect } from "next/navigation";
import { IFlight } from "@/mongodb/models/flightModel";
import Select from "../ui/FormElements/Select";
import { useState, useEffect } from "react";
import { IBranch } from "@/mongodb/models/branchModel";

// Тип для сумки
type BagItem = {
	_id: string;
	name: string;
	weightKg: number;
	ordersCount: number;
};

export default function FlightForm({ flight, redirectTo }: { flight: IFlight | null; redirectTo?: string }) {
	const isCreatingFlight = !!!flight;
	const [branches, setBranches] = useState<IBranch[]>([]);
	const [availableBags, setAvailableBags] = useState<BagItem[]>([]);
	const [selectedBags, setSelectedBags] = useState<string[]>([]);
	const [flightBags, setFlightBags] = useState<BagItem[]>([]);
	const [loadingBags, setLoadingBags] = useState(false);

	// Загружаем список складов (отделов)
	useEffect(() => {
		const loadBranches = async () => {
			try {
				const response = await fetch("/api/admin/branches");
				if (response.ok) {
					const data = await response.json();
					setBranches(data.branches || []);
					if (!data.branches || data.branches.length === 0) {
						console.warn("Список складов пуст. Убедитесь, что созданы отделения в системе.");
					}
				} else {
					console.error("Ошибка загрузки складов:", response.statusText);
				}
			} catch (error) {
				console.error("Ошибка загрузки складов:", error);
			}
		};
		loadBranches();
	}, []);

	// Загружаем свободные сумки (без рейса)
	useEffect(() => {
		const loadAvailableBags = async () => {
			setLoadingBags(true);
			try {
				const response = await fetch("/api/admin/bags/available");
				if (response.ok) {
					const data = await response.json();
					setAvailableBags(data.bags || []);
				}
			} catch (error) {
				console.error("Ошибка загрузки свободных сумок:", error);
			} finally {
				setLoadingBags(false);
			}
		};
		loadAvailableBags();
	}, []);

	// Загружаем сумки рейса, если редактируем существующий рейс
	useEffect(() => {
		if (!isCreatingFlight && flight?._id) {
			const loadFlightBags = async () => {
				try {
					const response = await fetch(`/api/admin/flights/${flight._id}/bags`);
					if (response.ok) {
						const data = await response.json();
						setFlightBags(data.bags || []);
					}
				} catch (error) {
					console.error("Ошибка загрузки сумок рейса:", error);
				}
			};
			loadFlightBags();
		}
	}, [isCreatingFlight, flight?._id]);

	const {
		register,
		handleSubmit,
		formState: { errors, isValid, isSubmitting },
	} = useForm<FlightFormData>({
		mode: "onChange",
		resolver: zodResolver(flightSchema),
		defaultValues: {
			...(isCreatingFlight
				? {}
				: {
						code: flight?.code || "",
						fromCountry: flight?.fromCountry || "",
						toCountry: flight?.toCountry || "",
						fromBranchId: flight?.fromBranchId ? String(flight.fromBranchId) : null,
						toBranchId: flight?.toBranchId ? String(flight.toBranchId) : null,
						plannedDepartureAt: flight?.plannedDepartureAt ? new Date(flight.plannedDepartureAt).toISOString().slice(0, 16) : null,
						plannedArrivalAt: flight?.plannedArrivalAt ? new Date(flight.plannedArrivalAt).toISOString().slice(0, 16) : null,
						admin_description: flight?.admin_description || null,
				  }),
		},
	});

	const handleAction = async (formData: FlightFormData) => {
		// Создаём или обновляем рейс
		const flightResponse = await fetch(isCreatingFlight ? "/api/admin/flights" : `/api/admin/flights/${flight?._id}`, {
			method: isCreatingFlight ? "POST" : "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...formData,
				plannedDepartureAt: formData.plannedDepartureAt ? new Date(formData.plannedDepartureAt).toISOString() : null,
				plannedArrivalAt: formData.plannedArrivalAt ? new Date(formData.plannedArrivalAt).toISOString() : null,
			}),
		});

		if (!flightResponse.ok) {
			const error = await flightResponse.json();
			toastShowResult({ type: "error", message: error.message || "Ошибка сохранения рейса" });
			return;
		}

		const flightData = await flightResponse.json();
		const flightId = flightData.flight?._id || flight?._id;

		// Если выбраны сумки, привязываем их к рейсу
		if (selectedBags.length > 0 && flightId) {
			const bagsResponse = await fetch(`/api/admin/flights/${flightId}/bags`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bagIds: selectedBags }),
			});

			if (!bagsResponse.ok) {
				toastShowResult({ type: "warning", message: "Рейс создан, но не удалось привязать сумки" });
			}
		}

		toastShowResult({ type: "success", message: isCreatingFlight ? "Рейс успешно создан" : "Рейс успешно обновлён" });
		redirect(redirectTo || "/admin/reports/flights");
	};

	const handleToggleBag = (bagId: string) => {
		setSelectedBags((prev) => (prev.includes(bagId) ? prev.filter((id) => id !== bagId) : [...prev, bagId]));
	};

	const handleRemoveBag = async (bagId: string) => {
		if (!flight?._id) return;
		try {
			const response = await fetch(`/api/admin/flights/${flight._id}/bags/${bagId}`, {
				method: "DELETE",
			});
			if (response.ok) {
				setFlightBags((prev) => prev.filter((bag) => bag._id !== bagId));
				toastShowResult({ type: "success", message: "Сумка отвязана от рейса" });
			}
		} catch (error) {
			toastShowResult({ type: "error", message: "Ошибка отвязки сумки" });
		}
	};

	return (
		<form
			className=" flex flex-col gap-4 py-6 w-full
                    lg:w-202
                    xl:gap-6 xl:w-219
                    "
			onSubmit={handleSubmit(handleAction)}
		>
			<div className="h2 text-f-blue-950 mb-6">{isCreatingFlight ? "Создание нового рейса" : "Обновление рейса"}</div>

			{/* Код рейса */}
			<Input {...register("code")} error={errors.code?.message} title="Код рейса" />

			{/* Страна отправления */}
			<Input {...register("fromCountry")} error={errors.fromCountry?.message} title="Страна отправления" />

			{/* Страна назначения */}
			<Input {...register("toCountry")} error={errors.toCountry?.message} title="Страна назначения" />

			{/* Склад отправления (отдел) */}
			<Select {...register("fromBranchId")} title="Отдел отправления" error={errors.fromBranchId?.message}>
				<option value="">Выберите отдел</option>
				{branches.length === 0 ? (
					<option disabled>Нет доступных отделений. Создайте отделение в разделе "Отделения".</option>
				) : (
					branches.map((branch) => (
						<option key={branch._id} value={branch._id}>
							{branch.title} {branch.country ? `(${branch.country})` : ""}
						</option>
					))
				)}
			</Select>

			{/* Склад назначения (отдел) */}
			<Select {...register("toBranchId")} title="Отдел назначения" error={errors.toBranchId?.message}>
				<option value="">Выберите отдел</option>
				{branches.length === 0 ? (
					<option disabled>Нет доступных отделений. Создайте отделение в разделе "Отделения".</option>
				) : (
					branches.map((branch) => (
						<option key={branch._id} value={branch._id}>
							{branch.title} {branch.country ? `(${branch.country})` : ""}
						</option>
					))
				)}
			</Select>

			{/* Планируемая дата отправления */}
			<Input {...register("plannedDepartureAt")} type="datetime-local" error={errors.plannedDepartureAt?.message} title="Планируемая дата отправления" />

			{/* Планируемая дата прибытия */}
			<Input {...register("plannedArrivalAt")} type="datetime-local" error={errors.plannedArrivalAt?.message} title="Планируемая дата прибытия" />

			{/* Описание */}
			<Input {...register("admin_description")} error={errors.admin_description?.message} title="Описание (для администратора)" type="textarea" />

			{/* Секция управления сумками */}
			<div style={{ marginTop: "24px", padding: "16px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
				<div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Управление сумками</div>

				{/* Список сумок, привязанных к рейсу (только при редактировании) */}
				{!isCreatingFlight && flightBags.length > 0 && (
					<div style={{ marginBottom: "24px" }}>
						<div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Сумки в рейсе:</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
							{flightBags.map((bag) => (
								<div
									key={bag._id}
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										padding: "12px",
										background: "#f5f5f5",
										borderRadius: "4px",
									}}
								>
									<div>
										<div style={{ fontWeight: "600" }}>{bag.name}</div>
										<div style={{ fontSize: "14px", color: "#666" }}>
											Вес: {bag.weightKg} кг, Заказов: {bag.ordersCount}
										</div>
									</div>
									<button
										type="button"
										onClick={() => handleRemoveBag(bag._id)}
										style={{
											padding: "6px 12px",
											background: "#d32f2f",
											color: "white",
											border: "none",
											borderRadius: "4px",
											cursor: "pointer",
										}}
									>
										Удалить
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Список свободных сумок для добавления */}
				<div>
					<div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Доступные сумки (выберите для добавления в рейс):</div>
					{loadingBags ? (
						<div>Загрузка сумок...</div>
					) : availableBags.length === 0 ? (
						<div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
							<div style={{ color: "#666", fontStyle: "italic" }}>Нет доступных сумок</div>
							<a
								href="/admin/reports/bags/new"
								style={{
									padding: "8px 16px",
									background: "#1976d2",
									color: "white",
									textDecoration: "none",
									borderRadius: "4px",
									fontSize: "14px",
								}}
							>
								+ Создать новую сумку
							</a>
						</div>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
							{availableBags.map((bag) => (
								<label
									key={bag._id}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "12px",
										padding: "12px",
										border: selectedBags.includes(bag._id) ? "2px solid #1976d2" : "1px solid #e0e0e0",
										borderRadius: "4px",
										cursor: "pointer",
										background: selectedBags.includes(bag._id) ? "#e3f2fd" : "white",
									}}
								>
									<input
										type="checkbox"
										checked={selectedBags.includes(bag._id)}
										onChange={() => handleToggleBag(bag._id)}
										style={{ width: "20px", height: "20px" }}
									/>
									<div style={{ flex: 1 }}>
										<div style={{ fontWeight: "600" }}>{bag.name}</div>
										<div style={{ fontSize: "14px", color: "#666" }}>
											Вес: {bag.weightKg} кг, Заказов: {bag.ordersCount}
										</div>
									</div>
								</label>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Кнопка отправки */}
			<button
				type="submit"
				disabled={!isValid || isSubmitting}
				style={{
					padding: "12px 24px",
					background: isValid ? "#1976d2" : "#ccc",
					color: "white",
					border: "none",
					borderRadius: "8px",
					cursor: isValid ? "pointer" : "not-allowed",
					fontSize: "16px",
					marginTop: "16px",
				}}
			>
				{isSubmitting ? "Сохранение..." : isCreatingFlight ? "Создать рейс" : "Обновить рейс"}
			</button>
		</form>
	);
}
