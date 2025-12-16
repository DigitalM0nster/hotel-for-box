"use client";

import { DeliveryProgress } from "@/components/ui/DeliveryProgress/DeliveryProgress";
import { StatusTimeline } from "@/components/ui/StatusTimeLine/StatusTimeLine";
import { IOrder } from "@/mongodb/models/orderModel";
import { IProduct } from "@/mongodb/models/productModel";
import DeliveryAdminPanel from "../DeliveryAdminPanel/DeliveryAdminPanel";
import { ArrowRightIco, Caretdown } from "@/icons/icons";

export default function OrderInfo({ order }: { order: IOrder }) {
    console.log("ORDER 🆔", order);

    const { products } = order;
    return (
        <div className="box bg-f-gray-50 flex flex-col gap-4">
            <div className="h3 text-f-accent">{order.description}</div>

            <div className="flex justify-between">
                <div className="h5 flex gap-1 text-f-gray-500">
                    <div>ID :</div>
                    <div>{order._id}</div>
                </div>
                <div className="text-f-gray-500">
                    {new Date(order.createdAt || 0).toLocaleString()}
                </div>
            </div>
            <div className="box flex justify-between gap-2 h4 bg-f-white-100">
                <div className="text-f-gray-500">{order.shopUrl}</div>
                <div>{order.track}</div>
                <div className="text-green-700">{order.products_total_cost}$</div>
            </div>

            <OrderProductList products={products} />

            <DeliveryProgress orderId={order._id!} status={order.status} orientation="horizontal" />

            <DeliveryAdminPanel order={order} />
        </div>
    );
}

function OrderProductList({ products }: { products: IProduct[] }) {
    return (
        <div className="box bg-f-white-100 flex flex-col gap-2">
            {products.map((product) => (
                <details key={product._id} className="group rounded-2xl p-4 bg-f-gray-50 ">
                    <summary className="body-2 cursor-pointer select-none text-f-accent flex justify-between relative pl-7">
                        <Caretdown className="rotate-180 group-open:-rotate-0 transition absolute left-0 scale-70 top-0.5" />
                        <div>{product.name}</div>
                        <div>x{product.quantity}</div>
                    </summary>
                    <div className="max-w-lg mx-auto">
                        <table className="w-full text-sm text-left">
                            <tbody className="divide-y divide-gray-200">
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Бренд</td>
                                    <td className="py-2">{product.brand}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Категория</td>
                                    <td className="py-2">{product.category}</td>
                                </tr>
                                {product.size && (
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700">Размер</td>
                                        <td className="py-2">{product.size}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Цвет</td>
                                    <td className="py-2 flex items-center gap-2">
                                        <span
                                            className="w-4 h-4 rounded-full border"
                                            style={{ backgroundColor: product.color }}
                                        ></span>
                                        {product.color}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Цена</td>
                                    <td className="py-2">${product.price}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Количество</td>
                                    <td className="py-2">{product.quantity}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Вес</td>
                                    <td className="py-2">{product.weight} кг</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Габариты</td>
                                    <td className="py-2">
                                        {product.width_x} × {product.height_y} × {product.depth_z}{" "}
                                        cм
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Описание</td>
                                    <td className="py-2 text-gray-600">
                                        {product.description || "---"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </details>
            ))}
        </div>
    );
}
