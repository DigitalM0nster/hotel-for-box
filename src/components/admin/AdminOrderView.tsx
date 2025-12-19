import Link from "next/link";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import styles from "@/components/admin/AdminTable.module.scss";
import { IOrder, StatusEnToRu } from "@/mongodb/models/orderModel";
import { getBranchesAll } from "@/libs/services/branchService";
import { updateOrderByAdmin, updateOrderStatusByAdmin, updateOrderPaymentInfo, updateOrderAttachmentsByAdmin } from "@/libs/services/orderService";
import { auth } from "@/auth";
import DeleteOrderButton from "./DeleteOrderButton";
import ProductDetailsRow from "./ProductDetailsRow";
import { ArrowLEftIco } from "@/icons/icons";

type AdminOrderViewProps = {
	order: IOrder;
	activeTab: "details" | "history";
};

// -------------------------------
// SERVER ACTIONS ДЛЯ ФОРМ
// -------------------------------

// Обновление логистики и общей информации заказа.
// На человеческом языке:
// - Берём значения из формы (трек, магазин, габариты, стоимость и т.д.)
// - Передаём их в updateOrderByAdmin, который меняет только эти поля в документе заказа.
// - Затем просим Next.js пересобрать страницу карточки, чтобы показать свежие данные.
async function handleUpdateLogistics(formData: FormData) {
	"use server";

	const orderId = String(formData.get("orderId") || "");
	const viewId = String(formData.get("viewId") || "");

	const track = (formData.get("track") as string | null)?.trim() || undefined;
	const shopUrl = (formData.get("shopUrl") as string | null)?.trim() || undefined;
	const externalOrderIdRaw = (formData.get("externalOrderId") as string | null) || "";
	const externalOrderId = externalOrderIdRaw.trim() || null;

	const parseNumber = (name: string): number | undefined => {
		const raw = (formData.get(name) as string | null) || "";
		if (!raw.trim()) return undefined;
		const num = Number(raw.replace(",", "."));
		return Number.isFinite(num) ? num : undefined;
	};
	const weight = parseNumber("weight");
	const width_x = parseNumber("width_x");
	const height_y = parseNumber("height_y");
	const depth_z = parseNumber("depth_z");

	const shelfRaw = (formData.get("shelf") as string | null) || "";
	const shelf = shelfRaw.trim() ? shelfRaw.trim() : null;

	const originBranchIdRaw = (formData.get("originBranchId") as string | null) || "";
	const destinationBranchIdRaw = (formData.get("destinationBranchId") as string | null) || "";

	const originBranchId = originBranchIdRaw.trim() ? originBranchIdRaw.trim() : null;
	const destinationBranchId = destinationBranchIdRaw.trim() ? destinationBranchIdRaw.trim() : null;

	const descriptionRaw = (formData.get("description") as string | null) || "";
	const description = descriptionRaw.trim() || undefined;

	await updateOrderByAdmin({
		orderId,
		track,
		shopUrl,
		externalOrderId,
		weight,
		width_x,
		height_y,
		depth_z,
		shelf,
		originBranchId,
		destinationBranchId,
		description,
	});

	revalidatePath(`/admin/orders/${viewId}`);
}

// Обновление статуса заказа.
// Здесь мы просто меняем поле status в документе,
// а вся «защита» (например, нельзя менять после Received) живёт в updateOrderStatusByAdmin.
async function handleUpdateStatus(formData: FormData) {
	"use server";

	const orderId = String(formData.get("orderId") || "");
	const viewId = String(formData.get("viewId") || "");
	const status = String(formData.get("status") || "Created") as IOrder["status"];

	await updateOrderStatusByAdmin({ orderId, status });
	revalidatePath(`/admin/orders/${viewId}`);
}

// Обновление платёжной информации.
// По сути, это «ручное управление» тем, что обычно делает платёжная система:
// - выставляем gateway (provider),
// - задаём ID транзакции,
// - правим сумму счёта и сумму оплат.
async function handleUpdatePayment(formData: FormData) {
	"use server";

	const orderId = String(formData.get("orderId") || "");
	const viewId = String(formData.get("viewId") || "");

	const provider = (formData.get("provider") as string | null) || undefined;
	const status = (formData.get("paymentStatus") as string | null) || undefined;
	const externalIdRaw = (formData.get("externalId") as string | null) || "";
	const externalId = externalIdRaw.trim() || null;

	const parseNumber = (name: string): number | undefined => {
		const raw = (formData.get(name) as string | null) || "";
		if (!raw.trim()) return undefined;
		const num = Number(raw.replace(",", "."));
		return Number.isFinite(num) ? num : undefined;
	};

	const order_coast = parseNumber("order_coast");
	const paid = parseNumber("paid");

	// Сначала обновляем сумму счёта (order_coast) через общий апдейтер заказа.
	if (order_coast !== undefined) {
		await updateOrderByAdmin({
			orderId,
			order_coast,
		});
	}

	// Затем обновляем платёжную информацию и поле paid.
	await updateOrderPaymentInfo({
		orderId,
		provider: provider as any,
		status: status as any,
		externalId,
		paid: paid !== undefined ? paid : undefined,
	});

	revalidatePath(`/admin/orders/${viewId}`);
}

// Обновление вложений (фото, документы и т.п.), которые админ прикрепляет к заказу.
// На человеческом языке:
// - из формы приходят строки с существующими вложениями и несколько "пустых" строк для добавления новых;
// - мы собираем итоговый список (без помеченных на удаление и с непустыми url);
// - отправляем его на бэкенд, где полностью перезаписываем массив attachments в документе заказа.
async function handleUpdateAttachments(formData: FormData) {
	"use server";

	const orderId = String(formData.get("orderId") || "");
	const viewId = String(formData.get("viewId") || "");

	const existingCount = Number(formData.get("existingAttachmentsCount") || "0");

	const attachments: { url: string; fileName?: string | null; description?: string | null }[] = [];

	// 1. Существующие вложения: берём их как есть, если не помечены на удаление.
	for (let index = 0; index < existingCount; index += 1) {
		const urlRaw = (formData.get(`attachment_url_${index}`) as string | null) || "";
		const fileNameRaw = (formData.get(`attachment_fileName_${index}`) as string | null) || "";
		const descriptionRaw = (formData.get(`attachment_description_${index}`) as string | null) || "";
		const markedForDelete = formData.get(`attachment_delete_${index}`) === "on";

		const url = urlRaw.trim();
		const fileName = fileNameRaw.trim();
		const description = descriptionRaw.trim();

		if (!url || markedForDelete) continue;

		attachments.push({
			url,
			fileName: fileName || null,
			description: description || null,
		});
	}

	// 2. Новые вложения: реальные файлы, загруженные с устройства.
	const files = formData.getAll("new_files") as File[];

	if (files.length > 0) {
		const uploadDir = path.join(process.cwd(), "public", "uploads", "orders");
		await fs.mkdir(uploadDir, { recursive: true });

		for (const file of files) {
			if (!file || typeof file === "string" || file.size === 0) continue;

			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Немного чистим имя файла, чтобы не было странных символов.
			const originalName = file.name || "file";
			const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
			const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
			const fileNameOnDisk = `${uniqueSuffix}-${safeName}`;

			const filePath = path.join(uploadDir, fileNameOnDisk);
			await fs.writeFile(filePath, buffer);

			const publicUrl = `/uploads/orders/${fileNameOnDisk}`;

			attachments.push({
				url: publicUrl,
				fileName: originalName,
				description: null,
			});
		}
	}

	await updateOrderAttachmentsByAdmin({
		orderId,
		attachments,
	});

	revalidatePath(`/admin/orders/${viewId}`);
}

// Карточка одного заказа в админке.
// Здесь админ видит ключевую информацию и может её менять через server actions выше.
export default async function AdminOrderView({ order, activeTab }: AdminOrderViewProps) {
	const currentOrder = order;
	// Используем только orderId (человекочитаемый ID) для URL и отображения.
	// Если orderId отсутствует, это ошибка (должен быть сгенерирован в getOrderById).
	// В качестве fallback используем _id, но это не должно происходить в нормальной работе.
	const viewId = currentOrder.orderId || currentOrder._id || "";

	const currentPaymentStatus = currentOrder.paymentInfo?.status || "invoice_not_issued";

	const paymentGatewayLabel = currentOrder.paymentInfo?.provider ? `Метод оплаты: ${currentOrder.paymentInfo.provider}` : "Метод оплаты не указан";

	// Подгружаем все существующие отделения, чтобы давать выбор из списка.
	const branches = await getBranchesAll();

	// Проверяем, является ли текущий пользователь суперадмином (для показа кнопки удаления).
	const session = await auth();
	const isSuperAdmin = session?.user.role === "super";

	return (
		<div className={styles.adminTableWrapper}>
			{/* Кнопка "К списку заказов" в самом верху страницы */}
			<div className={styles.adminTableActionsRowTop}>
				<Link href="/admin/orders" className={styles.adminBackButton}>
					<ArrowLEftIco width={16} height={16} />
					<span>К списку заказов</span>
				</Link>
			</div>

			{/* Название заказа */}
			<div className={styles.adminTableHeaderRow}>
				<div className={styles.adminFiltersPanelTitle}>
					Заказ №{currentOrder.orderId || "—"} (статус: {StatusEnToRu[currentOrder.status]})
				</div>
			</div>

			<div className={styles.adminOrderTabs}>
				<Link href={`/admin/orders/${viewId}`} className={`${styles.adminOrderTab} ${activeTab === "details" ? styles.adminOrderTabActive : ""}`}>
					Просмотр заказа
				</Link>
				<Link href={`/admin/orders/${viewId}?tab=history`} className={`${styles.adminOrderTab} ${activeTab === "history" ? styles.adminOrderTabActive : ""}`}>
					История
				</Link>
			</div>

			{activeTab === "details" ? (
				<div className={styles.adminOrderCardGrid}>
					<section className={styles.adminOrderCardSection}>
						<div className={styles.adminOrderCardTitle}>Основная информация</div>
						<div style={{ fontSize: 12, color: "#7a8498", marginBottom: 4 }}>
							Сначала заполняем данные по самому заказу: трек, магазин, суммы, вес, габариты и склады.
						</div>
						<form action={handleUpdateLogistics} className={styles.adminOrderForm}>
							<input type="hidden" name="orderId" value={currentOrder._id} />
							<input type="hidden" name="viewId" value={viewId} />

							<div className={styles.adminOrderCardRow}>
								<span className={styles.adminOrderCardKey}>Номер заказа</span>
								<span className={styles.adminOrderCardValue}>{currentOrder.orderId ? `№${currentOrder.orderId}` : "—"}</span>
							</div>
							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="externalOrderId">
									Номер в американской системе
								</label>
								<input id="externalOrderId" name="externalOrderId" defaultValue={currentOrder.externalOrderId || ""} className={styles.adminOrderInput} />
							</div>
							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="track">
									Трек-номер
								</label>
								<input id="track" name="track" defaultValue={currentOrder.track} className={styles.adminOrderInput} />
							</div>
							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="shopUrl">
									Магазин
								</label>
								<input id="shopUrl" name="shopUrl" defaultValue={currentOrder.shopUrl} className={styles.adminOrderInput} />
							</div>
							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="description">
									Описание
								</label>
								<textarea id="description" name="description" defaultValue={currentOrder.description || ""} className={styles.adminOrderTextarea} />
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="weight">
									Вес, кг
								</label>
								<input
									id="weight"
									name="weight"
									defaultValue={typeof currentOrder.weight === "number" ? String(currentOrder.weight) : ""}
									className={styles.adminOrderInput}
								/>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="width_x">
									Габариты, см (Ш х В х Г)
								</label>
								<div className={styles.adminOrderTripleInputRow}>
									<input
										id="width_x"
										name="width_x"
										placeholder="Ш"
										defaultValue={typeof currentOrder.width_x === "number" ? String(currentOrder.width_x) : ""}
										className={styles.adminOrderInput}
									/>
									<input
										id="height_y"
										name="height_y"
										placeholder="В"
										defaultValue={typeof currentOrder.height_y === "number" ? String(currentOrder.height_y) : ""}
										className={styles.adminOrderInput}
									/>
									<input
										id="depth_z"
										name="depth_z"
										placeholder="Г"
										defaultValue={typeof currentOrder.depth_z === "number" ? String(currentOrder.depth_z) : ""}
										className={styles.adminOrderInput}
									/>
								</div>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="shelf">
									Полка на складе
								</label>
								<input id="shelf" name="shelf" defaultValue={currentOrder.shelf || ""} className={styles.adminOrderInput} />
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="originBranchId">
									Отделение отправления (Монголия)
								</label>
								<select id="originBranchId" name="originBranchId" defaultValue={String(currentOrder.originBranchId || "")} className={styles.adminOrderInput}>
									<option value="">Не выбрано</option>
									{branches.map((branch) => (
										<option key={branch._id} value={branch._id}>
											{branch.title} — {branch.city}
										</option>
									))}
								</select>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="destinationBranchId">
									Отделение получения (Россия)
								</label>
								<select
									id="destinationBranchId"
									name="destinationBranchId"
									defaultValue={String(currentOrder.destinationBranchId || "")}
									className={styles.adminOrderInput}
								>
									<option value="">Не выбрано</option>
									{branches.map((branch) => (
										<option key={branch._id} value={branch._id}>
											{branch.title} — {branch.city}
										</option>
									))}
								</select>
							</div>

							<div className={styles.adminTableFooter}>
								<button type="submit" className={styles.adminTableActionButton}>
									Сохранить логистику и общую информацию
								</button>
							</div>
						</form>
					</section>

					<section className={styles.adminOrderCardSection}>
						<div className={styles.adminOrderCardTitle}>Получатель</div>
						<div className={styles.adminOrderCardRow}>
							<span className={styles.adminOrderCardKey}>Город</span>
							<span className={styles.adminOrderCardValue}>{currentOrder.adressSnapshot?.city || "—"}</span>
						</div>
						<div className={styles.adminOrderCardRow}>
							<span className={styles.adminOrderCardKey}>Страна</span>
							<span className={styles.adminOrderCardValue}>{currentOrder.adressSnapshot?.country || "—"}</span>
						</div>
						<div className={styles.adminOrderCardRow}>
							<span className={styles.adminOrderCardKey}>ФИО</span>
							<span className={styles.adminOrderCardValue}>
								{[currentOrder.adressSnapshot?.recipientSurname, currentOrder.adressSnapshot?.recipientName, currentOrder.adressSnapshot?.recipientPatronymic]
									.filter(Boolean)
									.join(" ") || "—"}
							</span>
						</div>
						<div className={styles.adminOrderCardRow}>
							<span className={styles.adminOrderCardKey}>Телефон</span>
							<span className={styles.adminOrderCardValue}>{currentOrder.adressSnapshot?.phone1 || "—"}</span>
						</div>
						<div className={styles.adminOrderCardRow}>
							<span className={styles.adminOrderCardKey}>Способ доставки</span>
							<span className={styles.adminOrderCardValue}>
								{currentOrder.adressSnapshot?.deliveryMethod === "courier" ? "Курьер до двери" : "Доставка до склада"}
							</span>
						</div>
					</section>

					{/* Секция с информацией о пользователе (отправителе заказа) */}
					<section className={styles.adminOrderCardSection}>
						<div className={styles.adminOrderCardTitle}>Клиент (отправитель)</div>
						{/* Используем userSnapshot, если пользователь удалён, иначе пытаемся получить из populate */}
						{currentOrder.userSnapshot?.isDeleted ? (
							<>
								<div className={styles.adminOrderCardRow}>
									<span className={styles.adminOrderCardKey}>Статус</span>
									<span className={styles.adminOrderCardValue} style={{ color: "#c53030", fontWeight: 500 }}>
										Пользователь удалён
									</span>
								</div>
								<div className={styles.adminOrderCardRow}>
									<span className={styles.adminOrderCardKey}>ФИО</span>
									<span className={styles.adminOrderCardValue}>
										{[currentOrder.userSnapshot.surname, currentOrder.userSnapshot.name, currentOrder.userSnapshot.patronymic].filter(Boolean).join(" ") ||
											currentOrder.userSnapshot.name ||
											"—"}
									</span>
								</div>
								<div className={styles.adminOrderCardRow}>
									<span className={styles.adminOrderCardKey}>ID</span>
									<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.publicId || "—"}</span>
								</div>
								<div className={styles.adminOrderCardRow}>
									<span className={styles.adminOrderCardKey}>Email</span>
									<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.email || "—"}</span>
								</div>
								<div className={styles.adminOrderCardRow}>
									<span className={styles.adminOrderCardKey}>Телефон</span>
									<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.phone1 || "—"}</span>
								</div>
								{currentOrder.userSnapshot.city && (
									<div className={styles.adminOrderCardRow}>
										<span className={styles.adminOrderCardKey}>Город</span>
										<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.city}</span>
									</div>
								)}
							</>
						) : (
							<>
								{/* Если пользователь не удалён, показываем информацию из populate или userSnapshot */}
								{currentOrder.user ? (
									<>
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>ФИО</span>
											<span className={styles.adminOrderCardValue}>
												{[currentOrder.user.surname, currentOrder.user.name, currentOrder.user.patronymic].filter(Boolean).join(" ") ||
													currentOrder.user.name ||
													"—"}
											</span>
										</div>
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>ID</span>
											<span className={styles.adminOrderCardValue}>{currentOrder.user.publicId || currentOrder.user._id || "—"}</span>
										</div>
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>Email</span>
											<span className={styles.adminOrderCardValue}>{currentOrder.user.email || "—"}</span>
										</div>
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>Телефон</span>
											<span className={styles.adminOrderCardValue}>{currentOrder.user.phone1 || "—"}</span>
										</div>
										{currentOrder.user.city && (
											<div className={styles.adminOrderCardRow}>
												<span className={styles.adminOrderCardKey}>Город</span>
												<span className={styles.adminOrderCardValue}>{currentOrder.user.city}</span>
											</div>
										)}
										<Link
											href={`/admin/users/${currentOrder.user.publicId || currentOrder.user._id}`}
											target="_blank"
											rel="noopener noreferrer"
											className={`${styles.adminTableActionButton} ${styles.link}`}
										>
											Открыть профиль пользователя →
										</Link>
									</>
								) : currentOrder.userSnapshot ? (
									<>
										{/* Если populate не сработал, но есть userSnapshot */}
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>ФИО</span>
											<span className={styles.adminOrderCardValue}>
												{[currentOrder.userSnapshot.surname, currentOrder.userSnapshot.name, currentOrder.userSnapshot.patronymic]
													.filter(Boolean)
													.join(" ") ||
													currentOrder.userSnapshot.name ||
													"—"}
											</span>
										</div>
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>ID</span>
											<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.publicId || "—"}</span>
										</div>
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>Email</span>
											<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.email || "—"}</span>
										</div>
										<div className={styles.adminOrderCardRow}>
											<span className={styles.adminOrderCardKey}>Телефон</span>
											<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.phone1 || "—"}</span>
										</div>
										{currentOrder.userSnapshot.city && (
											<div className={styles.adminOrderCardRow}>
												<span className={styles.adminOrderCardKey}>Город</span>
												<span className={styles.adminOrderCardValue}>{currentOrder.userSnapshot.city}</span>
											</div>
										)}
									</>
								) : (
									<div className={styles.adminOrderCardRow}>
										<span className={styles.adminOrderCardValue}>Информация о пользователе недоступна</span>
									</div>
								)}
							</>
						)}
					</section>

					<section className={styles.adminOrderCardSection}>
						<div className={styles.adminOrderCardTitle}>Оплата</div>
						<div style={{ fontSize: 12, color: "#7a8498", marginBottom: 4 }}>Здесь фиксируем сумму счёта, факт оплаты и данные платёжки.</div>
						<form action={handleUpdatePayment} className={styles.adminOrderForm}>
							<input type="hidden" name="orderId" value={currentOrder._id} />
							<input type="hidden" name="viewId" value={viewId} />

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="paymentStatus">
									Статус платежа
								</label>
								<select id="paymentStatus" name="paymentStatus" defaultValue={currentPaymentStatus} className={styles.adminOrderInput}>
									<option value="invoice_not_issued">Счёт не выставлен</option>
									<option value="pending">Ожидает оплаты</option>
									<option value="paid">Оплачен</option>
									<option value="failed">Ошибка оплаты</option>
									<option value="refunded">Возврат</option>
								</select>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="order_coast_payment">
									Сумма счёта за доставку, ₽
								</label>
								<input
									id="order_coast_payment"
									name="order_coast"
									defaultValue={typeof currentOrder.order_coast === "number" ? String(currentOrder.order_coast) : ""}
									className={styles.adminOrderInput}
								/>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="paid_payment">
									Оплачено, ₽
								</label>
								<input
									id="paid_payment"
									name="paid"
									defaultValue={typeof currentOrder.paid === "number" ? String(currentOrder.paid) : ""}
									className={styles.adminOrderInput}
								/>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="provider">
									Платёжная система
								</label>
								<select id="provider" name="provider" defaultValue={currentOrder.paymentInfo?.provider || "manual"} className={styles.adminOrderInput}>
									<option value="manual">Вручную (оператор)</option>
									<option value="yookassa">ЮKassa</option>
									<option value="other">Другая система</option>
								</select>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="externalId">
									Внешний ID платежа
								</label>
								<input id="externalId" name="externalId" defaultValue={currentOrder.paymentInfo?.externalId || ""} className={styles.adminOrderInput} />
							</div>

							<div className={styles.adminOrderCardRow}>
								<span className={styles.adminOrderCardKey}>Дата оплаты</span>
								<span className={styles.adminOrderCardValue}>
									{currentOrder.paymentInfo?.paidAt ? new Date(currentOrder.paymentInfo.paidAt).toLocaleString() : "—"}
								</span>
							</div>

							<div className={styles.adminTableFooter}>
								<button type="submit" className={styles.adminTableActionButton}>
									Сохранить платёжные данные
								</button>
							</div>
						</form>
					</section>

					<section className={`${styles.adminOrderCardSection} ${styles.adminOrderCardSectionProducts}`}>
						<div className={styles.adminOrderCardTitle}>Товары в заказе</div>
						{!currentOrder.products || currentOrder.products.length === 0 ? (
							<div className={styles.adminOrderCardValue}>Товары в заказе не найдены</div>
						) : (
							<table className={styles.adminTable}>
								<thead>
									<tr>
										<th>#</th>
										<th>Название</th>
										<th>Бренд</th>
										<th>Категория</th>
										<th>Цена</th>
										<th>Кол-во</th>
										<th>Вес</th>
										<th className={styles.productDetailsHeader}>Детали</th>
									</tr>
								</thead>
								<tbody>
									{currentOrder.products.map((product, index) => (
										<ProductDetailsRow key={product._id || `${product.name}-${index}`} product={product} index={index} />
									))}
								</tbody>
							</table>
						)}
					</section>

					<section className={styles.adminOrderCardSection}>
						<div className={styles.adminOrderCardTitle}>Вложения (фото, документы)</div>
						<div style={{ fontSize: 12, color: "#7a8498", marginBottom: 4 }}>Здесь можно хранить ссылки на фото коробок, сканы накладных и другие файлы по заказу.</div>
						<form action={handleUpdateAttachments} className={styles.adminOrderForm}>
							<input type="hidden" name="orderId" value={currentOrder._id} />
							<input type="hidden" name="viewId" value={viewId} />
							<input type="hidden" name="existingAttachmentsCount" value={currentOrder.attachments?.length || 0} />

							{!currentOrder.attachments || currentOrder.attachments.length === 0 ? (
								<div className={styles.adminOrderCardRow}>
									<span className={styles.adminOrderCardValue}>Вложений пока нет — добавьте новые ниже.</span>
								</div>
							) : (
								currentOrder.attachments.map((attachment, index) => {
									const isImage = /\.(jpe?g|png|gif|webp)$/i.test(attachment.url || "");

									return (
										<div key={index} className={styles.adminOrderCardRow}>
											<div className={styles.adminOrderCardKey}>Вложение #{index + 1}</div>
											<div className={styles.adminOrderCardValue} style={{ flexDirection: "column", alignItems: "stretch" }}>
												{/* Скрытые поля для передачи данных на сервер */}
												<input type="hidden" name={`attachment_url_${index}`} value={attachment.url} />
												<input type="hidden" name={`attachment_fileName_${index}`} value={attachment.fileName || ""} />
												<input type="hidden" name={`attachment_description_${index}`} value={attachment.description || ""} />

												{isImage && (
													<div style={{ marginBottom: 4 }}>
														<img
															src={attachment.url}
															alt={attachment.fileName || "Предпросмотр вложения"}
															style={{
																maxWidth: "140px",
																maxHeight: "140px",
																objectFit: "cover",
																borderRadius: 4,
																border: "1px solid #E1E4EA",
															}}
														/>
													</div>
												)}

												<div style={{ marginBottom: 4 }}>
													<a href={attachment.url} target="_blank" rel="noopener noreferrer">
														{attachment.fileName || "Открыть файл"}
													</a>
												</div>
												{attachment.description && <div style={{ fontSize: 12, color: "#7a8498" }}>{attachment.description}</div>}
												<label style={{ fontSize: 12, marginTop: 6 }}>
													<input type="checkbox" name={`attachment_delete_${index}`} style={{ marginRight: 6 }} />
													Удалить это вложение
												</label>
											</div>
										</div>
									);
								})
							)}

							{/* Загрузка новых файлов с устройства */}
							<div className={styles.adminOrderCardRow}>
								<div className={styles.adminOrderCardKey}>Новые вложения</div>
								<div className={styles.adminOrderCardValue} style={{ flexDirection: "column", alignItems: "stretch" }}>
									<label htmlFor="new_files" style={{ fontSize: 12, marginBottom: 2 }}>
										Выберите один или несколько файлов
									</label>
									<input id="new_files" name="new_files" type="file" multiple className={styles.adminOrderInput} />
									<div style={{ fontSize: 12, color: "#7a8498", marginTop: 4 }}>
										Файлы будут сохранены на сервере и появятся в списке вложений после сохранения.
									</div>
								</div>
							</div>

							<div className={styles.adminTableFooter}>
								<button type="submit" className={styles.adminTableActionButton}>
									Сохранить вложения
								</button>
							</div>
						</form>
					</section>

					<section className={styles.adminOrderCardSection}>
						<div className={styles.adminOrderCardTitle}>Статус заказа</div>
						<form action={handleUpdateStatus} className={styles.adminOrderForm}>
							<input type="hidden" name="orderId" value={currentOrder._id} />
							<input type="hidden" name="viewId" value={viewId} />

							<div className={styles.adminOrderCardRow}>
								<span className={styles.adminOrderCardKey}>Текущий статус</span>
								<span className={styles.adminOrderCardValue}>{StatusEnToRu[currentOrder.status]}</span>
							</div>

							<div className={styles.adminOrderCardRow}>
								<label className={styles.adminOrderCardKey} htmlFor="status">
									Новый статус
								</label>
								<select id="status" name="status" defaultValue={currentOrder.status} className={styles.adminOrderInput}>
									{Object.keys(StatusEnToRu).map((statusKey) => (
										<option key={statusKey} value={statusKey}>
											{StatusEnToRu[statusKey as IOrder["status"]]}
										</option>
									))}
								</select>
							</div>

							<div className={styles.adminTableFooter}>
								<button type="submit" className={styles.adminTableActionButton}>
									Сохранить статус
								</button>
							</div>
						</form>
					</section>
				</div>
			) : (
				<section className={styles.adminOrderCardSection}>
					<div className={styles.adminOrderCardTitle}>История заказа</div>
					{!currentOrder.history || currentOrder.history.length === 0 ? (
						<div className={styles.adminOrderCardValue}>История пока пуста.</div>
					) : (
						<table className={styles.adminTable}>
							<thead>
								<tr>
									<th>Событие</th>
									<th>Дата</th>
									<th>Пользователь</th>
									<th>Отделение</th>
									<th>Полка</th>
									<th>ID группы</th>
									<th>Статус</th>
								</tr>
							</thead>
							<tbody>
								{[...currentOrder.history]
									.sort((a, b) => {
										const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
										const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
										return db - da;
									})
									.map((record, index) => (
										<tr key={index} className={styles.adminTableRow}>
											<td>{record.case}</td>
											<td>{record.createdAt ? new Date(record.createdAt).toLocaleString() : "—"}</td>
											<td>{record.userName || "—"}</td>
											<td>{record.department || "—"}</td>
											<td>{record.shelf || "—"}</td>
											<td>{record.groupId || "—"}</td>
											<td>{record.status ? StatusEnToRu[record.status] || record.status : "—"}</td>
										</tr>
									))}
							</tbody>
						</table>
					)}
				</section>
			)}

			{/* Кнопка удаления заказа внизу страницы (только для суперадмина) */}
			{isSuperAdmin && (
				<div className={styles.adminTableActionsRowBottom}>
					<DeleteOrderButton orderId={currentOrder.orderId || currentOrder._id || ""} />
				</div>
			)}
		</div>
	);
}
