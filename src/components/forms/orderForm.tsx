"use client";

import { useMemo, useState } from "react";
import { Input } from "../ui/FormElements/Input";
import { IProduct } from "@/mongodb/models/productModel";
import Select from "../ui/FormElements/Select";
import { CATEGORIES } from "@/data/constants/categories";
import { CLOTHINGSIZES } from "@/data/constants/clothingSizes";
import { IUser } from "@/mongodb/models/userModel";
import { IOrder } from "@/mongodb/models/orderModel";
import ProductForm, { Product } from "./productForm";
import { PlusIco } from "@/icons/icons";
import { toast } from "react-toastify";
import { createOrder } from "@/libs/services/orderService";

const stepsState = [`Шаг 1. Декларация `, `Шаг 2. Оформление `];

export default function OrderForm({ order = null, user }: { user: IUser; order: IOrder | null }) {
    const [step, setStep] = useState(0);
    const [products, setProducts] = useState<Product[]>([]);
    const [adressId, setAdressId] = useState<string>("");
    const [description, setDescription] = useState("");
    const [track, setTrack] = useState("");
    const [shopUrl, setShopUrl] = useState("");
    const [isAddProduct, setIsAddProduct] = useState(false);
    const [updatedProductIdx, setUpdatedProductIDx] = useState<number | null>(null);

    const isAddProductToggle = () => setIsAddProduct((state) => !state);
    const addProduct = (product: Product) => {
        setProducts((state) => [...state, product]);
        setIsAddProduct(false);
    };
    const updateProduct = (idx: number, product: Product) => {
        const tempProducts = [...products];
        tempProducts[idx] = product;
        setProducts(tempProducts);
        setUpdatedProductIDx(null);
        toast.success("Товар успешно обновлен");
    };

    const productsListHTML = useMemo(() => {
        return products.map((product, idx) => {
            const { name, price, width_x, height_y, depth_z, weight } = product;
            if (updatedProductIdx !== null && idx === updatedProductIdx) {
                const updateFn = updateProduct.bind(null, idx);
                return (
                    <ProductForm
                        key={name}
                        addOrUpdateProductFn={updateFn}
                        product={product}
                        closeFn={() => setUpdatedProductIDx(null)}
                    />
                );
            }
            return (
                <div
                    className="relative box bg-f-gray-30 cursor-pointer"
                    key={name}
                    onClick={() => setUpdatedProductIDx(idx)}
                >
                    <div className="absolute text-f-blue-950 number-3 left-0 top-0">{idx + 1}</div>
                    <div className=" flex justify-between text-f-blue-950">
                        <div className="body-2">{name}</div>
                        <div className="number-3 text-f-accent">{price}$</div>
                    </div>
                    <div className="flex body-4">
                        <div>{`${width_x}X${height_y}X${depth_z} см, Вес: ${weight}`}</div>
                    </div>
                </div>
            );
        });
    }, [products, updatedProductIdx]);

    const totalPriceHTML = useMemo(() => {
        let total = 0.0;
        products.forEach(({ price, quantity }) => (total += price * quantity));
        return {
            html: (
                <div className="flex flex-col gap-2">
                    <div className="number-1 text-f-accent">${total.toFixed(2)}</div>
                    <div className="body-3 text-f-blue-950">Общая стоимость декларации </div>
                </div>
            ),
            num: total.toFixed(2),
        };
    }, [products]);

    const stepHtml = useMemo(
        () => (
            <div className="h2 text-f-blue-950 mb-6 border-b-1 border-f-gray-200 pb-6">
                {!order ? stepsState[step] : "Обновление заказа"}
            </div>
        ),
        [step]
    );

    //!Validation
    const isOrderComplete = useMemo(() => !!products.length && !!adressId, [products, adressId]);

    //!Data forming
    const consignee = useMemo(() => {
        return user.adresses?.find((adress) => adress._id === adressId);
    }, [adressId]);

    const nameConsignee = useMemo(() => {
        if (consignee) {
            if (consignee.isBusiness) {
                return consignee.companyName;
            } else {
                return `${consignee.recipientSurname} ${consignee.recipientName} ${consignee.recipientPatronymic}`;
            }
        }
        return "unannamed";
    }, [consignee]);

    //!Funcs
    async function costumCreateOrder() {
        const res = await createOrder({
            track,
            shopUrl,
            adressId,
            description,
            userId: user._id!,
            products,
            products_total_cost: Number(totalPriceHTML.num) || 0,
        });

        if (res) {
            toast.success("Ваша посылка успешно оформлена!");
            return;
        }

        toast.error("Возникла ошибка, попробуйте снова или позже");
    }

    if (step === 0)
        return (
            <div
                className=" flex flex-col gap-4 py-6 w-full
                    lg:w-202
                    xl:gap-6 xl:w-219
                    "
            >
                {stepHtml}
                <div className="border-b-1 border-f-gray-200 pb-6">
                    {!!user.adresses?.length && (
                        <Select
                            onChange={(e) => setAdressId(() => e.target.value)}
                            options={user.adresses?.map((adress) => ({
                                value: adress._id!,
                                title: `${adress.city}`,
                            }))}
                            title="Выберете получателя"
                            disabledOption="выбор получателя"
                            defaultValue={""}
                        />
                    )}
                    <Input
                        title="Описание"
                        type="textarea"
                        value={description}
                        onChange={(e) => setDescription(() => e.target.value)}
                    />
                    <div className="flex gap-4 w-full *:w-full">
                        <Input
                            title="Номер отслеживания"
                            value={track}
                            onChange={(e) => setTrack(() => e.target.value)}
                        />
                        <Input
                            title="Сайт, с которого заказываете"
                            value={shopUrl}
                            onChange={(e) => setShopUrl(() => e.target.value)}
                        />
                    </div>
                </div>

                {/* <div>Products : {products.length}</div> */}

                {productsListHTML}

                {isAddProduct ? (
                    <ProductForm addOrUpdateProductFn={addProduct} closeFn={isAddProductToggle} />
                ) : (
                    <div
                        className="flex gap-2 items-center cursor-pointer"
                        onClick={isAddProductToggle}
                    >
                        <PlusIco className="*:fill-f-accent" />
                        <span className="button-2 text-f-accent">Добавить посылку</span>
                    </div>
                )}

                {totalPriceHTML.html}
                <button
                    className={`button-1 btn   text-f-white-100 
                                disabled:bg-f-blue-disabled disabled:cursor-not-allowed
                                `}
                    disabled={!isOrderComplete}
                    onClick={() => setStep(() => 1)}
                >
                    Следующий шаг
                </button>
            </div>
        );

    if (step === 1)
        return (
            <div className="flex flex-col items-start gap-3">
                {stepHtml}

                <div className="box shadow-2xl flex flex-col gap-8">
                    <div className="h2 text-f-accent">{description}</div>

                    <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-6 space-y-4">
                        <div className="text-lg font-medium text-neutral-600">
                            Информация об отслеживании
                        </div>

                        <div className="divide-y divide-neutral-200">
                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">
                                    Трек номер
                                </div>
                                <div className="text-sm text-neutral-800 break-words">
                                    {track || "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-6 space-y-4">
                        <div className="text-lg font-medium text-neutral-600">
                            Информация о заказе
                        </div>

                        <div className="divide-y divide-neutral-200">
                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">
                                    Сайт магазина
                                </div>
                                <div className="text-sm text-neutral-800 break-words">
                                    {shopUrl || "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-6 space-y-4">
                        <div className="text-lg font-medium text-neutral-600">
                            Содержание заказа
                        </div>

                        <div className="space-y-3">
                            {products.map((product, idx) => (
                                <div
                                    key={product.name + idx}
                                    className="grid grid-cols-[32px_1fr_90px_60px] gap-3 items-center text-neutral-700"
                                >
                                    <div className="text-sm font-medium opacity-60">{idx + 1}</div>

                                    <div className="text-sm">{product.name}</div>

                                    <div className="text-sm font-semibold">{product.price} $</div>

                                    <div className="text-sm">×{product.quantity}</div>
                                </div>
                            ))}
                        </div>

                        <div className=" pt-3 border-t border-neutral-300 flex justify-between text-lg font-semibold text-neutral-800">
                            <span className="text-f-accent">Суммарная стоимость</span>
                            <span className="text-f-accent">{totalPriceHTML.num} $</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-6 space-y-4">
                        <div className="text-lg font-medium text-neutral-600">
                            Информация о грузополучателе
                        </div>

                        <div className="divide-y divide-neutral-200">
                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">Тип</div>
                                <div className="text-sm text-neutral-800">
                                    {consignee?.isBusiness ? "Бизнес" : "Частный"}
                                </div>
                            </div>

                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">Имя</div>
                                <div className="text-sm text-neutral-800">{nameConsignee}</div>
                            </div>

                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">Телефон</div>
                                <div className="text-sm text-neutral-800">{consignee?.phone1}</div>
                            </div>

                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">
                                    Дополнительный телефон
                                </div>
                                <div className="text-sm text-neutral-800">
                                    {consignee?.phone2 || "—"}
                                </div>
                            </div>

                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">Страна</div>
                                <div className="text-sm text-neutral-800">{consignee?.country}</div>
                            </div>

                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">Город</div>
                                <div className="text-sm text-neutral-800">{consignee?.city}</div>
                            </div>

                            <div className="grid grid-cols-[160px_1fr] gap-4 py-2 items-center">
                                <div className="text-sm font-medium text-neutral-600">Адрес</div>
                                <div className="text-sm text-neutral-800 break-words">
                                    {consignee?.adress}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="button-1 btn" onClick={() => setStep(() => 0)}>
                        Изменить
                    </button>
                    <button className="button-1 btn" onClick={costumCreateOrder}>
                        Создать заказ
                    </button>
                </div>
            </div>
        );
}
