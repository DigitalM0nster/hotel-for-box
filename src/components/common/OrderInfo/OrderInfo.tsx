"use client";

import { IOrder, StatusEnToRu } from "@/mongodb/models/orderModel";
import { StatusTimeline } from "@/components/ui/StatusTimeLine/StatusTimeLine";
import styles from "./OrderInfo.module.scss";

export default function OrderInfo({ order }: { order: IOrder }) {
	const { products, adressSnapshot } = order;

	// В новой модели всегда используем снимок адреса, сохранённый в заказе.
	const adress = adressSnapshot;

	// Формируем полное имя получателя
	const recipientFullName = adress?.recipientName ? [adress.recipientName, adress.recipientSurname, adress.recipientPatronymic].filter(Boolean).join(" ") : "-";

	// ID получателя (ИНН для бизнеса, паспорт для физлица)
	const recipientId = adress?.isBusiness ? adress?.recipientInnNumber || "-" : adress?.passportSeriesNumber || "-";

	// Подсчет итогов по продуктам
	const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
	const totalCost = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

	// Тип заказа (Personal/Business)
	const orderType = order.isBusiness ? "Бизнес" : "Персональный";

	// Тип получателя (Personal/Business)
	const recipientType = adress?.isBusiness ? "Бизнес" : "Персональный";

	// Тип доставки из адреса
	const shipmentType = adress?.deliveryMethod === "courier" ? "Курьер" : adress?.deliveryMethod === "warehouse" ? "Склад" : "-";

	// Есть ли выставленный администратором счёт (ориентируемся на наличие стоимости доставки)
	const hasInvoice = typeof order.order_coast === "number" && !Number.isNaN(order.order_coast);

	// Человеческий статус оплаты по счёту
	let invoiceStatus = "Счёт не оплачен";
	if (typeof order.paid === "number" && order.paid > 0) {
		if (order.order_coast != null && order.paid >= order.order_coast) {
			invoiceStatus = "Счёт оплачен";
		} else {
			invoiceStatus = "Оплачен частично";
		}
	}

	return (
		<div className={styles.infoWrapper}>
			{/* Заголовок - название заказа */}
			<div className={styles.title}>{order.description}</div>

			{/* Секция TRACKING INFO */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>ИНФОРМАЦИЯ ОБ ОТСЛЕЖИВАНИИ</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>ID заказа</div>
					{/* Показываем человекочитаемый ID заказа (orderId), а не технический _id. */}
					<div className={styles.infoValue}>#{order.orderId || order._id}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Номер отслеживания</div>
					<div className={styles.infoValue}>{order.track || "-"}</div>
				</div>
			</div>

			{/* Визуальное отображение статуса заказа */}
			<div className={styles.statusSection}>
				<StatusTimeline current={order.status} statusUpdateTime={order.updatedAt} orderCreatedAt={order.createdAt} />
			</div>

			{/* Секция ORDER INFO */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>ИНФОРМАЦИЯ О ЗАКАЗЕ</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Описание заказа</div>
					<div className={styles.infoValue}>{order.description}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Тип доставки</div>
					<div className={styles.infoValue}>{shipmentType}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Тип заказа</div>
					<div className={styles.infoValue}>{orderType}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Сайт</div>
					<div className={styles.infoValue}>{order.shopUrl}</div>
				</div>

				{/* Информация о счёте прямо в блоке заказа */}
				{hasInvoice ? (
					<>
						<div className={styles.infoRow}>
							<div className={styles.infoLabel}>Стоимость доставки</div>
							<div className={styles.infoValue}>{typeof order.order_coast === "number" ? `$${order.order_coast.toFixed(2)}` : "—"}</div>
						</div>
						<div className={styles.infoRow}>
							<div className={styles.infoLabel}>Оплачено</div>
							<div className={styles.infoValue}>{typeof order.paid === "number" ? `$${order.paid.toFixed(2)} (${invoiceStatus})` : `0.00 $ (${invoiceStatus})`}</div>
						</div>
					</>
				) : (
					<div className={styles.infoRow}>
						<div className={styles.infoLabel}>Статус счёта</div>
						<div className={styles.infoValue}>Счёт ещё не выставлен администратором</div>
					</div>
				)}
			</div>

			{/* Секция ORDER CONTENTS */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>СОДЕРЖИМОЕ ЗАКАЗА</div>

				{products.map((product, index) => {
					const totalProductCost = (product.price || 0) * (product.quantity || 0);
					return (
						<details key={product._id || index} className={styles.productCard} open={products.length === 1}>
							<summary className={styles.productHeader}>
								<div className={styles.productHeaderLeft}>
									<div className={styles.productName}>{product.name || "Без названия"}</div>
									{product.brand && <div className={styles.productBrand}>{product.brand}</div>}
								</div>
								<div className={styles.productHeaderRight}>
									<div className={styles.productQty}>×{product.quantity}</div>
									<div className={styles.productPrice}>${totalProductCost.toFixed(2)}</div>
								</div>
							</summary>

							<div className={styles.productBody}>
								<div className={styles.infoRow}>
									<div className={styles.infoLabel}>Категория</div>
									<div className={styles.infoValue}>{product.category || "—"}</div>
								</div>
								<div className={styles.infoRow}>
									<div className={styles.infoLabel}>Размер</div>
									<div className={styles.infoValue}>{product.size || "—"}</div>
								</div>
								<div className={styles.infoRow}>
									<div className={styles.infoLabel}>Цвет</div>
									<div className={styles.infoValue}>{product.color || "—"}</div>
								</div>
								<div className={styles.infoRow}>
									<div className={styles.infoLabel}>Цена за единицу</div>
									<div className={styles.infoValue}>${(product.price || 0).toFixed(2)}</div>
								</div>
								<div className={styles.infoRow}>
									<div className={styles.infoLabel}>Количество</div>
									<div className={styles.infoValue}>{product.quantity}</div>
								</div>
								<div className={styles.infoRow}>
									<div className={styles.infoLabel}>Вес</div>
									<div className={styles.infoValue}>{product.weight ? `${product.weight} кг` : "—"}</div>
								</div>
								<div className={styles.infoRow}>
									<div className={styles.infoLabel}>Габариты</div>
									<div className={styles.infoValue}>
										{product.width_x && product.height_y && product.depth_z ? `${product.width_x}×${product.height_y}×${product.depth_z} см` : "—"}
									</div>
								</div>
							</div>
						</details>
					);
				})}

				<div className={styles.totalRow}>
					<div className={styles.totalLabel}>ИТОГО</div>
					<div className={styles.totalDetails}>
						<span>Кол-во: {totalQuantity}</span>
						<span>${totalCost.toFixed(2)}</span>
					</div>
				</div>
			</div>

			{/* Секция CONSIGNEE INFO */}
			<div className={styles.section}>
				<div className={styles.sectionTitle}>ИНФОРМАЦИЯ О ПОЛУЧАТЕЛЕ</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Тип</div>
					<div className={styles.infoValue}>{recipientType}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Имя</div>
					<div className={styles.infoValue}>{recipientFullName}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>ID</div>
					<div className={styles.infoValue}>{recipientId}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Номер телефона</div>
					<div className={styles.infoValue}>{adress?.phone1 || "-"}</div>
				</div>
				{adress?.phone2 && (
					<div className={styles.infoRow}>
						<div className={styles.infoLabel}>Дополнительный телефон</div>
						<div className={styles.infoValue}>{adress.phone2}</div>
					</div>
				)}
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Страна</div>
					<div className={styles.infoValue}>{adress?.country || "-"}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Адрес</div>
					<div className={styles.infoValue}>{adress?.adress || "-"}</div>
				</div>
				<div className={styles.infoRow}>
					<div className={styles.infoLabel}>Почтовый индекс</div>
					<div className={styles.infoValue}>{adress?.zip_code || "-"}</div>
				</div>
				{adress?.admin_description && (
					<div className={styles.infoRow}>
						<div className={styles.infoLabel}>Другая информация</div>
						<div className={styles.infoValue}>{adress.admin_description}</div>
					</div>
				)}
			</div>
		</div>
	);
}
