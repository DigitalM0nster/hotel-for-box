"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/FormElements/Input";
import Select from "../ui/FormElements/Select";
import PhoneSimple from "../ui/FormElements/PhoneSimple";
import { CATEGORIES } from "@/data/constants/categories";
import { IUser } from "@/mongodb/models/userModel";
import { IOrder } from "@/mongodb/models/orderModel";
import { IAdress } from "@/mongodb/models/adressModel";
import { Product } from "./productForm";
import { PlusIco } from "@/icons/icons";
import { toast } from "react-toastify";
import { createOrder, updateOrder } from "@/libs/services/orderService";
import { createAdress } from "@/libs/services/adressService";
import { getBranchesAll } from "@/libs/services/branchService";
import { IBranch } from "@/mongodb/models/branchModel";
import styles from "./orderForm.module.scss";

const stepsState = [`Шаг 1. Декларация `, `Шаг 2. Оформление `];

// Оставляем структуру товара такой же, как в ProductForm (без описания).
// Важно: тип совпадает с тем, что ожидает бэкенд.
type OrderProduct = Product;

export default function OrderForm({ order = null, user, isAdmin = false }: { user: IUser; order: IOrder | null; isAdmin?: boolean }) {
	const router = useRouter();
	const [step, setStep] = useState(0);
	// Флаг, что мы отправляем форму (чтобы запретить повторные клики)
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Если это редактирование, предварительно заполняем товары из заказа,
	// иначе начинаем с пустого списка и добавляем один товар в useEffect ниже.
	const [products, setProducts] = useState<OrderProduct[]>(() => {
		// При редактировании берём товары прямо из заказа (они теперь лежат внутри order.products).
		if (order && Array.isArray(order.products) && order.products.length > 0) {
			return order.products.map((p) => ({
				name: p.name || "",
				brand: p.brand || "",
				category: p.category || "",
				size: p.size || "",
				color: p.color || "",
				price: p.price || 0,
				quantity: p.quantity || 1,
				weight: p.weight || 0,
				width_x: p.width_x || 0,
				height_y: p.height_y || 0,
				depth_z: p.depth_z || 0,
			}));
		}
		return [];
	});

	const [adressId, setAdressId] = useState<string>(order?.adressId ? String(order.adressId) : "");
	// Выбранный адрес в дропдауне: ID существующего адреса или "new" для создания нового
	const hasAdresses = !!user.adresses?.length;
	const [selectedAddress, setSelectedAddress] = useState<string>(() => {
		if (order?.adressId) return String(order.adressId);
		if (hasAdresses && user.adresses?.[0]?._id) return user.adresses[0]._id;
		return "new";
	});

	const [description, setDescription] = useState(order?.description || "");
	const [track, setTrack] = useState(order?.track || "");
	const [shopUrl, setShopUrl] = useState(order?.shopUrl || "");
	const [productExpanded, setProductExpanded] = useState<boolean[]>([]);
	const [isBusiness, setIsBusiness] = useState(order?.isBusiness || false);
	const [removeOuterBox, setRemoveOuterBox] = useState(order?.removeOuterBox || false);
	const [exporterName, setExporterName] = useState(order?.exporterName || "");
	const [exporterAddress, setExporterAddress] = useState(order?.exporterAddress || "");
	const [exporterPhone, setExporterPhone] = useState(order?.exporterPhone || "");
	const [exporterInn, setExporterInn] = useState(order?.exporterInn || "");
	// Поля адреса для шага 2 (страну не спрашиваем — ставим дефолт при сохранении).
	const [adressForm, setAdressForm] = useState({
		city: "",
		adress: "",
		zip_code: "",
		recipientName: "",
		recipientSurname: "",
		recipientPatronymic: "",
		recipientInnNumber: "",
		phone1: "",
		phone2: "",
		deliveryMethod: "warehouse" as "warehouse" | "courier",
		admin_description: "",
	});
	// Исходный адрес для сравнения (чтобы понять, был ли адрес изменён)
	const [originalAddress, setOriginalAddress] = useState<IAdress | null>(null);
	// Флаг, что адрес был изменён пользователем
	const [isAddressModified, setIsAddressModified] = useState(false);
	// Список отделений для выбора при доставке до склада
	const [branches, setBranches] = useState<IBranch[]>([]);
	// Выбранное отделение для доставки до склада
	// При редактировании заказа используем отделение из заказа, если оно есть
	const [selectedDestinationBranchId, setSelectedDestinationBranchId] = useState<string>(() => {
		if (order?.destinationBranchId) {
			return String(order.destinationBranchId);
		}
		return "";
	});

	const createEmptyProduct = (): OrderProduct => ({
		name: "",
		brand: "",
		category: "",
		size: "",
		color: "",
		price: 0,
		quantity: 1,
		weight: 0,
		width_x: 0,
		height_y: 0,
		depth_z: 0,
	});

	const addProduct = () => {
		setProducts((state) => [...state, createEmptyProduct()]);
		setProductExpanded((state) => [...state, true]);
	};

	// При создании нового заказа сразу показываем карточку товара,
	// чтобы кнопка перехода не блокировалась из-за пустого списка.
	useEffect(() => {
		if (!order && products.length === 0) {
			setProducts([createEmptyProduct()]);
			setProductExpanded([true]);
		}
	}, [order, products.length]);

	// Загружаем список отделений при монтировании компонента
	useEffect(() => {
		async function loadBranches() {
			try {
				const branchesList = await getBranchesAll();
				setBranches(branchesList);
			} catch (error) {
				console.error("Ошибка при загрузке отделений:", error);
			}
		}
		loadBranches();
	}, []);

	// Если нет сохранённых адресов, автоматически переключаемся на создание нового
	useEffect(() => {
		if (!hasAdresses && selectedAddress !== "new") {
			setSelectedAddress("new");
		}
	}, [hasAdresses, selectedAddress]);

	// Заполняем форму адреса, если выбран существующий адрес
	useEffect(() => {
		if (selectedAddress !== "new" && hasAdresses) {
			const needsFill = !originalAddress || originalAddress._id !== selectedAddress;

			if (needsFill) {
				const selectedAdress = user.adresses?.find((addr) => addr._id === selectedAddress);
				if (selectedAdress) {
					setAdressId(selectedAddress);
					setOriginalAddress(selectedAdress);
					setIsAddressModified(false);
					setAdressForm({
						city: selectedAdress.city || "",
						adress: selectedAdress.adress || "",
						zip_code: selectedAdress.zip_code || "",
						recipientName: selectedAdress.recipientName || "",
						recipientSurname: selectedAdress.recipientSurname || "",
						recipientPatronymic: selectedAdress.recipientPatronymic || "",
						recipientInnNumber: selectedAdress.recipientInnNumber || "",
						phone1: selectedAdress.phone1 || "",
						phone2: selectedAdress.phone2 || "",
						deliveryMethod: selectedAdress.deliveryMethod || "warehouse",
						admin_description: selectedAdress.admin_description || "",
					});
				}
			}
		}
	}, [selectedAddress, hasAdresses, originalAddress, user.adresses]);

	const toggleProduct = (idx: number, nextState?: boolean) => {
		setProductExpanded((state) =>
			state.map((open, i) => {
				if (i !== idx) return open;
				return typeof nextState === "boolean" ? nextState : !open;
			})
		);
	};

	const updateProductField = <K extends keyof OrderProduct>(idx: number, field: K, value: OrderProduct[K]) => {
		setProducts((state) => {
			const next = [...state];
			next[idx] = { ...next[idx], [field]: value };
			return next;
		});
	};

	const removeProduct = (idx: number) => {
		setProducts((state) => state.filter((_, i) => i !== idx));
		setProductExpanded((state) => state.filter((_, i) => i !== idx));
	};

	const productsListHTML = useMemo(() => {
		return products.map((product, idx) => {
			const { name, price, quantity, width_x, height_y, depth_z, weight, brand, category, size, color } = product;
			const isOpen = productExpanded[idx] ?? true;
			return (
				<details
					key={`product-${idx}`}
					className={`${styles.productCard} productCard`}
					open={isOpen}
					onToggle={(e) => toggleProduct(idx, (e.currentTarget as HTMLDetailsElement).open)}
				>
					<summary className={styles.productCardHeader}>
						<div className={styles.productHeaderLeft}>
							<div className={styles.productIndex}>{idx + 1}</div>
							<div className={styles.productName}>{name || "Новый товар"}</div>
						</div>
						<div className={styles.productHeaderRight}>
							<div className={styles.productQty}>x{quantity}</div>
							<div className={styles.productPrice}>{price}$</div>
						</div>
					</summary>
					<div className={styles.productCardBody}>
						<Input title="Название*" value={name} onChange={(e) => updateProductField(idx, "name", e.target.value)} />
						<Input title="Бренд" value={brand} onChange={(e) => updateProductField(idx, "brand", e.target.value)} />
						<div className={styles.inlineInputsRow}>
							<Select
								onChange={(e) => updateProductField(idx, "category", e.target.value)}
								options={CATEGORIES.map((catStr) => ({ title: catStr, value: catStr }))}
								title="Категория*"
								disabledOption="Выбор категории"
								value={category || ""}
							/>
							<Input title="Размер" value={size} onChange={(e) => updateProductField(idx, "size", e.target.value)} placeholder="Например: 42" />
						</div>
						<div className={styles.inlineInputsRow}>
							<Input title="Цвет" value={color} onChange={(e) => updateProductField(idx, "color", e.target.value)} placeholder="Например: красный" />
							<Input
								title="Цена*"
								type="number"
								value={price}
								onChange={(e) => updateProductField(idx, "price", Math.max(0, Number(e.target.value) || 0))}
								beforeText="$"
							/>
						</div>
						<div className={styles.inlineInputsRow}>
							<Input
								title="Количество*"
								type="number"
								value={quantity}
								onChange={(e) => updateProductField(idx, "quantity", Math.max(1, Number(e.target.value) || 0))}
								placeholder="1"
							/>
							<Input
								title="Вес"
								type="number"
								value={weight}
								onChange={(e) => updateProductField(idx, "weight", Math.max(0, Number(e.target.value) || 0))}
								afterText="кг"
							/>
						</div>
						<div className={styles.inlineInputsRow}>
							<Input
								title="Ширина"
								type="number"
								value={width_x}
								onChange={(e) => updateProductField(idx, "width_x", Math.max(0, Number(e.target.value) || 0))}
								afterText="см"
							/>
							<Input
								title="Высота"
								type="number"
								value={height_y}
								onChange={(e) => updateProductField(idx, "height_y", Math.max(0, Number(e.target.value) || 0))}
								afterText="см"
							/>
							<Input
								title="Глубина"
								type="number"
								value={depth_z}
								onChange={(e) => updateProductField(idx, "depth_z", Math.max(0, Number(e.target.value) || 0))}
								afterText="см"
							/>
						</div>
						<div className={styles.productActions}>
							<button type="button" className={styles.secondaryButton} onClick={() => removeProduct(idx)}>
								Удалить товар
							</button>
						</div>
					</div>
				</details>
			);
		});
	}, [products, productExpanded]);

	const totalPriceHTML = useMemo(() => {
		let total = 0.0;
		products.forEach(({ price, quantity }) => (total += price * quantity));
		return {
			html: (
				<div className={styles.totalSummary}>
					<div className={styles.totalValue}>${total.toFixed(2)}</div>
					<div className={styles.totalLabel}>Общая стоимость декларации</div>
				</div>
			),
			num: total.toFixed(2),
		};
	}, [products]);

	const stepHtml = useMemo(() => <div className={styles.stepTitle}>{!order ? stepsState[step] : "Обновление заказа"}</div>, [step, order]);

	//!Validation
	const hasProducts = useMemo(() => !!products.length, [products]);

	const isProductValid = (product: OrderProduct) => {
		// Обязательные поля товара: название, категория, цена > 0, количество > 0
		const hasValidCategory = product.category && product.category.trim().length > 0;
		return product.name.trim().length > 0 && hasValidCategory && product.price > 0 && product.quantity > 0;
	};

	const isStep1Complete = useMemo(() => {
		const baseFieldsValid = hasProducts && description.trim().length > 0 && track.trim().length > 0 && shopUrl.trim().length > 0 && products.every(isProductValid);
		const businessFieldsValid =
			!isBusiness || (exporterName.trim().length > 0 && exporterAddress.trim().length > 0 && exporterPhone.trim().length > 0 && exporterInn.trim().length > 0);
		return baseFieldsValid && businessFieldsValid;
	}, [hasProducts, description, track, shopUrl, products, isBusiness, exporterName, exporterAddress, exporterPhone, exporterInn]);

	// Валидация адреса: при доставке до склада нужно выбрать отделение, при курьере - полный адрес с городом
	const isAdressFormReady = useMemo(() => {
		// Базовые поля: имя, фамилия, телефон (город не нужен при доставке до склада)
		const baseFields = !!adressForm.recipientName && !!adressForm.recipientSurname && !!adressForm.phone1;

		if (adressForm.deliveryMethod === "courier") {
			// При доставке курьером нужны: город, адрес, имя, фамилия, телефон
			return baseFields && !!adressForm.city && !!adressForm.adress;
		}
		// При доставке до склада нужно выбрать отделение (город не нужен)
		if (adressForm.deliveryMethod === "warehouse") {
			return baseFields && !!selectedDestinationBranchId;
		}
		return baseFields;
	}, [adressForm, selectedDestinationBranchId]);

	// Валидация зависит от выбранного адреса
	const canCreateOrder = useMemo(() => {
		if (selectedAddress === "new") {
			return isAdressFormReady;
		} else {
			return !!selectedAddress && selectedAddress !== "new";
		}
	}, [selectedAddress, isAdressFormReady]);

	//!Funcs
	async function submitOrder(targetAdressId: string) {
		const commonPayload = {
			track,
			shopUrl,
			adressId: targetAdressId,
			description,
			userId: user._id!,
			products,
			products_total_cost: Number(totalPriceHTML.num) || 0,
			isBusiness,
			removeOuterBox,
			exporterName: exporterName || null,
			exporterAddress: exporterAddress || null,
			exporterPhone: exporterPhone || null,
			exporterInn: exporterInn || null,
			// Передаём выбранное отделение получения, если доставка до склада
			destinationBranchId: adressForm.deliveryMethod === "warehouse" && selectedDestinationBranchId ? selectedDestinationBranchId : null,
		};

		const res = order ? await updateOrder({ ...commonPayload, orderId: order._id! }) : await createOrder(commonPayload);

		if (res.success && res.orderId) {
			toast.success(order ? "Заказ обновлён" : "Ваша посылка успешно оформлена!");
			// Если создаём/редактируем заказ из админки — редиректим в админку, иначе в личный кабинет.
			const redirectPath = isAdmin ? `/admin/orders/${res.orderId}` : `/user/orders/${res.orderId}`;
			router.push(redirectPath);
			return;
		}

		toast.error(res.error || (order ? "Не удалось обновить заказ" : "Возникла ошибка, попробуйте снова или позже"));
	}

	// Создание/обновление заказа с адресом. Страну не спрашиваем — ставим дефолт "Россия".
	async function handleCreateOrder() {
		// Как только пользователь нажал кнопку, блокируем повторные клики
		setIsSubmitting(true);

		let targetAdressId = "";

		try {
			if (selectedAddress !== "new" && !isAddressModified) {
				// Используем выбранный существующий адрес без изменений
				targetAdressId = selectedAddress;
			} else {
				// Если создаём новый адрес или существующий был изменён - создаём новый адрес
				const res = await createAdress({
					...adressForm,
					userId: user._id!,
					isBusiness,
					country: "Россия",
				});

				if (res.type !== "success" || !res.adressId) {
					toast.error(res.message || "Не удалось создать адрес");
					return;
				}

				targetAdressId = res.adressId;

				if (isAddressModified && selectedAddress !== "new") {
					toast.success("Адрес был изменён. Создан новый адрес для этого заказа. Старые заказы продолжат использовать прежний адрес.");
				} else {
					toast.success("Адрес сохранён");
				}
			}

			await submitOrder(targetAdressId);
		} finally {
			// Если редирект не произошёл (ошибка и т.п.) — снова разрешаем кликать по кнопке
			setIsSubmitting(false);
		}
	}

	// Обработчик изменения выбранного адреса в дропдауне
	const handleAddressSelect = (value: string) => {
		setSelectedAddress(value);
		if (value === "new") {
			setAdressId("");
			setOriginalAddress(null);
			setIsAddressModified(false);
			setAdressForm({
				city: "",
				adress: "",
				zip_code: "",
				recipientName: "",
				recipientSurname: "",
				recipientPatronymic: "",
				recipientInnNumber: "",
				phone1: "",
				phone2: "",
				deliveryMethod: "warehouse",
				admin_description: "",
			});
			setSelectedDestinationBranchId("");
		} else {
			const selectedAdress = user.adresses?.find((addr) => addr._id === value);
			if (selectedAdress) {
				setAdressId(value);
				setOriginalAddress(selectedAdress);
				setIsAddressModified(false);
				setAdressForm({
					city: selectedAdress.city || "",
					adress: selectedAdress.adress || "",
					zip_code: selectedAdress.zip_code || "",
					recipientName: selectedAdress.recipientName || "",
					recipientSurname: selectedAdress.recipientSurname || "",
					recipientPatronymic: selectedAdress.recipientPatronymic || "",
					recipientInnNumber: selectedAdress.recipientInnNumber || "",
					phone1: selectedAdress.phone1 || "",
					phone2: selectedAdress.phone2 || "",
					deliveryMethod: selectedAdress.deliveryMethod || "warehouse",
					admin_description: selectedAdress.admin_description || "",
				});
			}
		}
	};

	const updateAdressField = <K extends keyof typeof adressForm>(field: K, value: (typeof adressForm)[K]) => {
		setAdressForm((prev) => {
			const updated = { ...prev, [field]: value };

			// Если меняем способ доставки на курьера, сбрасываем выбранное отделение
			if (field === "deliveryMethod" && value === "courier") {
				setSelectedDestinationBranchId("");
			}

			if (originalAddress && selectedAddress !== "new") {
				const hasChanged =
					updated.city !== (originalAddress.city || "") ||
					updated.adress !== (originalAddress.adress || "") ||
					updated.zip_code !== (originalAddress.zip_code || "") ||
					updated.recipientName !== (originalAddress.recipientName || "") ||
					updated.recipientSurname !== (originalAddress.recipientSurname || "") ||
					updated.recipientPatronymic !== (originalAddress.recipientPatronymic || "") ||
					updated.recipientInnNumber !== (originalAddress.recipientInnNumber || "") ||
					updated.phone1 !== (originalAddress.phone1 || "") ||
					updated.phone2 !== (originalAddress.phone2 || "") ||
					updated.deliveryMethod !== (originalAddress.deliveryMethod || "warehouse") ||
					updated.admin_description !== (originalAddress.admin_description || "");

				setIsAddressModified(hasChanged);
			} else {
				setIsAddressModified(true);
			}

			return updated;
		});
	};

	if (step === 0)
		return (
			<div className={styles.formContainer}>
				{stepHtml}
				<div className={styles.sectionBox}>
					<div className={styles.checkboxRow}>
						{/* Тогл "Для бизнеса" такой же, как в форме адреса */}
						<Input type="toggle" title="Для бизнеса" checked={isBusiness} onChange={(e) => setIsBusiness(e.target.checked)} />
					</div>
					<Input title="Описание*" type="textarea" value={description} onChange={(e) => setDescription(() => e.target.value)} />
					<div className={styles.inlineInputsRow}>
						<Input title="Номер отслеживания*" value={track} onChange={(e) => setTrack(() => e.target.value)} />
						<Input title="Сайт, с которого заказываете*" value={shopUrl} onChange={(e) => setShopUrl(() => e.target.value)} />
					</div>
					<div className={styles.toggleRow}>
						<input type="checkbox" checked={removeOuterBox} onChange={(e) => setRemoveOuterBox(e.target.checked)} />
						<label className={styles.checkboxText}>Удалить внешнюю коробку и упаковать в полиэтиленовый пакет</label>
					</div>

					{isBusiness && (
						<div className={styles.businessBlock}>
							<div className={styles.inlineInputsRow}>
								<Input title="Имя экспортера*" value={exporterName} onChange={(e) => setExporterName(e.target.value)} />
								<Input title="Адрес экспортера*" value={exporterAddress} onChange={(e) => setExporterAddress(e.target.value)} />
							</div>
							<div className={styles.inlineInputsRow}>
								<Input title="Телефон экспортера*" value={exporterPhone} onChange={(e) => setExporterPhone(e.target.value)} />
								<Input title="ИНН экспортера*" value={exporterInn} onChange={(e) => setExporterInn(e.target.value)} />
							</div>
						</div>
					)}
				</div>

				<div className={styles.productsList}>{products.length > 0 && productsListHTML}</div>

				<div className={styles.addProductRow} onClick={addProduct}>
					<PlusIco className={styles.accentIcon} />
					<span className={styles.addProductText}>{products.length > 0 ? "Добавить ещё один товар" : "Добавить товар"}</span>
				</div>

				<div className={styles.totalBox}>{totalPriceHTML.html}</div>
				<button
					className={styles.primaryButton}
					disabled={!isStep1Complete}
					onClick={() => {
						setStep(() => 1);
						// Скроллим страницу вверх при переходе на следующий шаг
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
				>
					Следующий шаг
				</button>
				{!isStep1Complete && (
					<div style={{ marginTop: "8px", color: "#c53030" }}>
						Заполните все поля первого шага: описание, номер отслеживания, сайт с которого заказываете и обязательные поля в каждом товаре (название, категория, цена,
						количество).
						{isBusiness && (!exporterName.trim() || !exporterAddress.trim() || !exporterPhone.trim() || !exporterInn.trim()) && (
							<> Также заполните все поля экспортера (имя, адрес, телефон, ИНН).</>
						)}
					</div>
				)}
			</div>
		);

	if (step === 1)
		return (
			<div className={styles.formContainer}>
				{stepHtml}

				<div className={styles.sectionBox}>
					<div className={styles.sectionHeaderRow}>
						<div className={styles.sectionTitle}>Адрес получателя</div>
					</div>

					{/* Дропдаун со списком адресов и опцией "Создать новый адрес" */}
					{hasAdresses ? (
						<Select
							onChange={(e) => handleAddressSelect(e.target.value)}
							value={selectedAddress}
							options={[
								...(user.adresses?.map((adress) => ({
									value: adress._id!,
									title: `${adress.city}, ${adress.recipientSurname ? `${adress.recipientSurname} ${adress.recipientName}` : adress.recipientName}`,
								})) || []),
								{ value: "new", title: "Создать новый адрес" },
							]}
							title="Выберите адрес"
							disabledOption="Выберите адрес"
						/>
					) : (
						<div style={{ marginBottom: "12px", color: "#c53030" }}>Сохранённых адресов нет. Заполните форму ниже, чтобы добавить новый адрес.</div>
					)}

					{/* Показываем уведомление, если адрес был изменён */}
					{isAddressModified && selectedAddress !== "new" && originalAddress && (
						<div style={{ marginBottom: "12px", padding: "12px", backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", color: "#856404" }}>
							<strong>Адрес был изменён.</strong> При создании заказа будет создан новый адрес. Старые заказы продолжат использовать прежний адрес.
						</div>
					)}

					{/* Форма адреса */}
					<>
						<Select
							onChange={(e) => updateAdressField("deliveryMethod", e.target.value as "warehouse" | "courier")}
							value={adressForm.deliveryMethod}
							options={[
								{ value: "warehouse", title: "Доставка до склада" },
								{ value: "courier", title: "Курьер до двери" },
							]}
							title="Способ доставки"
							disabledOption="Выберите способ доставки"
						/>

						{/* При доставке до склада показываем выбор отделения */}
						{adressForm.deliveryMethod === "warehouse" && (
							<Select
								onChange={(e) => setSelectedDestinationBranchId(e.target.value)}
								value={selectedDestinationBranchId}
								options={branches.map((branch) => ({
									value: branch._id || "",
									title: `${branch.title} — ${branch.city}`,
								}))}
								title="Отделение получения"
								disabledOption="Выберите отделение"
							/>
						)}

						{/* Город нужен только при доставке курьером */}
						{adressForm.deliveryMethod === "courier" && (
							<div className={styles.inlineInputsRow}>
								<Input title="Город" value={adressForm.city} onChange={(e) => updateAdressField("city", e.target.value)} />
								<Input title="Индекс" value={adressForm.zip_code} onChange={(e) => updateAdressField("zip_code", e.target.value)} />
							</div>
						)}
						{adressForm.deliveryMethod === "courier" && <Input title="Адрес" value={adressForm.adress} onChange={(e) => updateAdressField("adress", e.target.value)} />}

						<div className={styles.inlineInputsRow}>
							<Input title="Фамилия получателя" value={adressForm.recipientSurname} onChange={(e) => updateAdressField("recipientSurname", e.target.value)} />
							<Input title="Имя получателя" value={adressForm.recipientName} onChange={(e) => updateAdressField("recipientName", e.target.value)} />
							<Input
								title="Отчество (необязательно)"
								value={adressForm.recipientPatronymic}
								onChange={(e) => updateAdressField("recipientPatronymic", e.target.value)}
							/>
						</div>

						<Input
							title="Номер документа / ИНН"
							value={adressForm.recipientInnNumber}
							onChange={(e) => updateAdressField("recipientInnNumber", e.target.value)}
							placeholder="Например: серия и номер паспорта или ИНН"
						/>

						<div className={styles.inlineInputsRow}>
							<PhoneSimple title="Телефон" value={adressForm.phone1} onChange={(value) => updateAdressField("phone1", value)} />
							<PhoneSimple title="Доп. телефон" value={adressForm.phone2} onChange={(value) => updateAdressField("phone2", value)} />
						</div>

						<Input
							title="Дополнительная информация"
							type="textarea"
							value={adressForm.admin_description}
							onChange={(e) => updateAdressField("admin_description", e.target.value)}
						/>
					</>
				</div>

				<div className={styles.totalBox}>{totalPriceHTML.html}</div>
				<div className={styles.buttonsRow}>
					<button className={styles.secondaryButton} onClick={() => setStep(() => 0)}>
						Назад
					</button>
					<button className={styles.primaryButton} disabled={!canCreateOrder || isSubmitting} onClick={handleCreateOrder}>
						{isSubmitting ? (order ? "Сохраняем..." : "Создаём...") : order ? "Сохранить изменения" : "Создать заказ"}
					</button>
				</div>
				{!canCreateOrder && (
					<div style={{ marginTop: "8px", color: "#c53030" }}>
						{selectedAddress === "new" || !hasAdresses
							? adressForm.deliveryMethod === "warehouse"
								? "Заполните форму адреса. При доставке до склада нужны: выбор отделения, имя, фамилия, телефон."
								: "Заполните форму адреса. При доставке курьером нужны: город, адрес, имя, фамилия, телефон."
							: "Выберите адрес из списка."}
					</div>
				)}

				<div className={styles.summaryBox}>
					<div className={styles.infoTitle}>Кратко о заказе</div>
					<div className={styles.infoRows}>
						<div className={styles.infoRow}>
							<div className={styles.infoKey}>Описание</div>
							<div className={styles.infoValue}>{description || "—"}</div>
						</div>
						<div className={styles.infoRow}>
							<div className={styles.infoKey}>Трек номер</div>
							<div className={styles.infoValue}>{track || "—"}</div>
						</div>
						<div className={styles.infoRow}>
							<div className={styles.infoKey}>Сайт магазина</div>
							<div className={styles.infoValue}>{shopUrl || "—"}</div>
						</div>
					</div>

					<div className={styles.infoTitle} style={{ marginTop: "12px" }}>
						Товары
					</div>
					<div className={styles.productsSummary}>
						{products.map((product, idx) => (
							<div key={product.name + idx} className={styles.productSummaryRow}>
								<div className={styles.productIndexSmall}>{idx + 1}</div>
								<div className={styles.productName}>{product.name || "Без названия"}</div>
								<div className={styles.productPrice}>{product.price} $</div>
								<div className={styles.productQuantity}>×{product.quantity}</div>
							</div>
						))}
					</div>

					<div className={styles.totalRow}>
						<span className={styles.accentText}>Суммарная стоимость</span>
						<span className={styles.accentText}>{totalPriceHTML.num} $</span>
					</div>
				</div>
			</div>
		);
}
