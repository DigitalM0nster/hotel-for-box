"use clent";

import { Input } from "@/components/ui/FormElements/Input";
import { IOrder } from "@/mongodb/models/orderModel";
import { useState } from "react";

export default function DeliveryAdminPanel({ order }: { order: IOrder }) {
    const [size, setSize] = useState({
        width_x: order.width_x || 0, // Ширина
        height_y: order.height_y || 0, //Высота
        depth_z: order.depth_z || 0, // Глубина
    });
    const [weight, setWeight] = useState(order.weight || 0);
    const [order_coast, setOrder_coast] = useState(order.order_coast || 0);
    const [admin_description, setAdmin_description] = useState(order.admin_description || "");
    const [h4b_us_id, setH4b_us_id] = useState(order.h4b_us_id || "");
    return (
        <div className="box w-full bg-f-white-100">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <div className="h5 text-f-blue-500">Размеры посылки</div>
                    <div className="flex justify-between gap-4 *:w-full">
                        <Input
                            title="Ширина"
                            value={size.width_x || ""}
                            onChange={(e) => {
                                setSize((state) => ({ ...state, width_x: e.target.value }));
                            }}
                            placeholder="X"
                            afterText="см"
                            type="number"
                        />
                        <Input
                            title="Высота"
                            value={size.height_y || ""}
                            onChange={(e) => {
                                setSize((state) => ({ ...state, height_y: e.target.value }));
                            }}
                            placeholder="Y"
                            afterText="см"
                            type="number"
                        />
                        <Input
                            title="Глубина"
                            value={size.depth_z || ""}
                            onChange={(e) => {
                                setSize((state) => ({ ...state, depth_z: e.target.value }));
                            }}
                            placeholder="Z"
                            afterText="см"
                            type="number"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="h5 text-f-blue-500">Вес посылки</div>
                    <Input
                        type="number"
                        onChange={(e) =>
                            setWeight((state) =>
                                Number(e.target.value) >= 0 ? e.target.value : state
                            )
                        }
                        value={weight}
                        afterText="кг"
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <div className="h5 text-f-blue-500">Описание и пометки</div>
                    <Input
                        type="textarea"
                        value={admin_description}
                        onChange={(e) => setAdmin_description(() => e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <div className="h5 text-f-blue-500">ID посылки на H4B USA</div>
                    <Input
                        type="text"
                        value={h4b_us_id}
                        onChange={(e) => setH4b_us_id(() => e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="h5 text-f-blue-500">Стоимость услуг</div>
                    <Input
                        type="number"
                        onChange={(e) =>
                            setOrder_coast((state) =>
                                Number(e.target.value) >= 0 ? e.target.value : state
                            )
                        }
                        value={order_coast}
                        afterText="руб."
                    />
                </div>

                <button className="btn">Выставить счет клиенту</button>
            </div>
        </div>
    );
}
