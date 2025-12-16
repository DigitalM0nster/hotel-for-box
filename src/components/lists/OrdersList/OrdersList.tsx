"use client";

import { progectPathes } from "@/config/pathes";
import { BoxBigIco, BoxSmallIco, PlusIco } from "@/icons/icons";
import { IOrder, StatusEnToRu } from "@/mongodb/models/orderModel";
import Link from "next/link";

export default function OrdersList({ orders }: { orders: IOrder[] }) {
    if (!orders.length)
        return (
            <div className="w-full h-full flex items-center justify-center ">
                <div className="flex flex-col gap-4">
                    <BoxBigIco className="self-center" />
                    <div className="body-1 text-f-blue-950">
                        У вас нет ожидаемых входящих посылок
                    </div>
                    <Link
                        href={progectPathes.ordersId.path + "new_order"}
                        className="flex gap-[11px] items-center justify-center px-6 py-2 md:py-3 border border-f-accent rounded-full bg-f-accent self-center"
                    >
                        <div className="button-2 text-white">Создать заказ</div>
                        <PlusIco className="**:text-white" width={18} height={18} />
                    </Link>
                </div>
            </div>
        );

    return (
        <div className="flex flex-col gap-2">
            {orders.map((order) => (
                <Link
                    key={order._id}
                    href={progectPathes.ordersId.path + order._id}
                    className="boxNoPadding bg-f-white-100 py-3 px-6 flex cursor-pointer justify-between"
                >
                    <div className="flex gap-4 w-full">
                        <BoxSmallIco className="self-center" />
                        <div className="w-full flex flex-col gap-2 ">
                            <div className="flex justify-between">
                                <div className="body-1 text-f-accent ">{order.description}</div>
                                <div className="body-4 text-f-gray-500 text-md self-end">
                                    {order._id}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div>{order.shopUrl}</div>
                                <div className="font-bold">{order.track}</div>
                            </div>
                            <div className="flex justify-between ">
                                <div className="flex items-center gap-2">
                                    <div className="body-3 text-f-gray-500">статус</div>
                                    <div className="text-green-700">
                                        {StatusEnToRu[order.status]}
                                    </div>
                                </div>
                                <div className="body-4 text-f-gray-500 text-md self-end">
                                    {new Date(order.createdAt || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
