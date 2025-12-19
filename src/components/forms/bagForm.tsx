"use client";

import { useForm, Controller } from "react-hook-form";
import { Input } from "../ui/FormElements/Input";
import { BagFormData, bagSchema } from "@/helpers/zod/validateZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastShowResult } from "@/helpers/toast/toastHelpers";
import { redirect } from "next/navigation";
import { IBag } from "@/mongodb/models/bagModel";
import OrderSearch, { OrderSearchResult } from "../ui/OrderSearch/OrderSearch";
import { useState, useEffect } from "react";

export default function BagForm({ bag, redirectTo }: { bag: IBag | null; redirectTo?: string }) {
	const isCreatingBag = !!!bag;
	const [selectedOrders, setSelectedOrders] = useState<OrderSearchResult[]>([]);

	// Загружаем информацию о заказах при редактировании сумки
	useEffect(() => {
		if (!isCreatingBag && bag?.orderIds && bag.orderIds.length > 0) {
			const loadOrdersInfo = async () => {
				try {
					// Загружаем информацию о каждом заказе
					const ordersPromises = bag.orderIds.map(async (orderId) => {
						const response = await fetch(`/api/admin/orders/search?q=${encodeURIComponent(orderId)}`);
						if (response.ok) {
							const data = await response.json();
							// Ищем заказ в результатах поиска
							const foundOrder = data.orders?.find((o: OrderSearchResult) => o.orderId === orderId);
							// Если заказ не найден через поиск, создаём минимальный объект
							if (!foundOrder) {
								return {
									_id: `order_${orderId}`,
									orderId: orderId,
									track: "-",
									weight: 0,
									status: "-",
									type: "order" as const,
								};
							}
							return foundOrder;
						}
						return null;
					});

					const orders = await Promise.all(ordersPromises);
					setSelectedOrders(orders.filter(Boolean) as OrderSearchResult[]);
				} catch (error) {
					console.error("Ошибка загрузки информации о заказах:", error);
				}
			};
			loadOrdersInfo();
		}
	}, [isCreatingBag, bag?.orderIds]);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isValid, isSubmitting },
		setValue,
	} = useForm({
		mode: "onChange",
		resolver: zodResolver(bagSchema),
		defaultValues: {
			...(isCreatingBag
				? {}
				: {
						name: bag?.name || "",
						weightKg: bag?.weightKg || 0,
						orderIds: bag?.orderIds || [],
						admin_description: bag?.admin_description || null,
				  }),
		},
	});

	// Обновляем orderIds в форме при изменении выбранных заказов
	useEffect(() => {
		const orderIds = selectedOrders.map((order) => order.orderId);
		setValue("orderIds", orderIds);
	}, [selectedOrders, setValue]);

	const handleAction = async (formData: BagFormData) => {
		// Создаём или обновляем сумку
		const bagResponse = await fetch(isCreatingBag ? "/api/admin/bags" : `/api/admin/bags/${bag?._id}`, {
			method: isCreatingBag ? "POST" : "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: formData.name,
				weightKg: Number(formData.weightKg) || 0,
				orderIds: formData.orderIds || [],
				admin_description: formData.admin_description || null,
			}),
		});

		if (!bagResponse.ok) {
			const error = await bagResponse.json();
			toastShowResult({ type: "error", message: error.message || "Ошибка сохранения сумки" });
			return;
		}

		toastShowResult({ type: "success", message: isCreatingBag ? "Сумка успешно создана" : "Сумка успешно обновлена" });
		redirect(redirectTo || "/admin/reports/bags");
	};

	return (
		<form
			className=" flex flex-col gap-4 py-6 w-full
                    lg:w-202
                    xl:gap-6 xl:w-219
                    "
			onSubmit={handleSubmit(handleAction)}
		>
			<div className="h2 text-f-blue-950 mb-6">{isCreatingBag ? "Создание новой сумки" : "Обновление сумки"}</div>

			{/* Название сумки */}
			<Input {...register("name")} error={errors.name?.message} title="Название сумки" placeholder="Например: Exp-Dec182025-4040" />

			{/* Вес сумки */}
			<Input {...register("weightKg")} type="number" error={errors.weightKg?.message} title="Вес сумки (кг)" step="0.01" min="0.01" />

			{/* Поиск и выбор заказов */}
			<Controller
				control={control}
				name="orderIds"
				render={({ field }) => (
					<OrderSearch
						value={selectedOrders}
						onChange={(orders) => {
							setSelectedOrders(orders);
							field.onChange(orders.map((o) => o.orderId));
						}}
						error={errors.orderIds?.message}
						title="Заказы в сумке"
					/>
				)}
			/>

			{/* Описание */}
			<Input {...register("admin_description")} error={errors.admin_description?.message} title="Описание (для администратора)" type="textarea" />

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
				{isSubmitting ? "Сохранение..." : isCreatingBag ? "Создать сумку" : "Обновить сумку"}
			</button>
		</form>
	);
}
