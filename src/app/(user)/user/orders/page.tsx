import OrdersList from "@/components/lists/OrdersList/OrdersList";
import OrderFilter from "@/components/ui/OrderFilter/OrderFilter";
import { progectPathes } from "@/config/pathes";
import {
    BoxBigIco,
    CloseIco,
    GroupsCombineIco,
    GroupsSplitIco,
    ParamsIco,
    PlusIco,
} from "@/icons/icons";
import { getUserOrders } from "@/libs/services/orderService";
import Link from "next/link";

export default async function OrderPage() {
    const orders = await getUserOrders();
    console.log("ORDERS ❤️", orders);
    return (
        <div className="flex flex-col w-full h-full ">
            <div
                className="flex flex-col gap-8 border-b border-b-f-gray-200 pb-4
                lg:gap-10
            "
            >
                <div className="flex justify-between">
                    <div className="h3 text-f-blue-950">Мои заказы</div>
                    <div
                        className=" gap-4 hidden
                                    md:flex
                                    "
                    >
                        <Link
                            href={progectPathes.ordersId.path + "new_order"}
                            className="flex gap-[11px] items-center justify-center px-6 py-2 md:py-3 border border-f-accent rounded-full bg-f-accent"
                        >
                            <div className="button-2 text-white">Создать заказ</div>
                            <PlusIco className="**:text-white" width={18} height={18} />
                        </Link>
                        <div className="flex gap-[11px] items-center justify-center px-6 py-2 md:py-3 border border-f-accent rounded-full bg-f-white-100">
                            <div className="button-2 text-f-accent">Объединить группы</div>
                            <GroupsCombineIco className="**:text-white" width={18} height={18} />
                        </div>
                        <div className="flex gap-[11px] items-center justify-center px-6 py-2 md:py-3 border border-f-accent rounded-full bg-f-white-100">
                            <div className="button-2 text-f-accent">Разделить заказ</div>
                            <GroupsSplitIco className="**:text-white" width={18} height={18} />
                        </div>
                    </div>
                </div>

                {/* МОДАЛКА МЕНЮ */}
                {true && (
                    <div
                        className="bg-black/30  fixed inset-0 p-4 flex items-start justify-end z-10
                                md:hidden
                                sm:
                                "
                    >
                        <div className="bg-f-white-100 rounded-lg p-4 flex flex-col gap-4">
                            <div className="flex justify-between">
                                <div className="h4-accent">Действия</div>
                                <CloseIco className="cursor-pointer" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-[11px] items-center justify-center px-6 py-2 md:py-3 border border-f-accent rounded-full bg-f-accent">
                                    <div className="button-2 text-white">Создать заказ</div>
                                    <PlusIco className="**:text-white" width={18} height={18} />
                                </div>
                                <div className="flex gap-[11px] items-center justify-center px-6 py-2 md:py-3 border border-f-accent rounded-full bg-f-white-100">
                                    <div className="button-2 text-f-accent">Объединить группы</div>
                                    <GroupsCombineIco
                                        className="**:text-white"
                                        width={18}
                                        height={18}
                                    />
                                </div>
                                <div className="flex gap-[11px] items-center justify-center px-6 py-2 md:py-3 border border-f-accent rounded-full bg-f-white-100">
                                    <div className="button-2 text-f-accent">Разделить заказ</div>
                                    <GroupsSplitIco
                                        className="**:text-white"
                                        width={18}
                                        height={18}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div
                    className="flex flex-col justify-between gap-4 
                                md:flex-row
                                "
                >
                    <div className="flex ">
                        <div className="tag text-f-blue-950 bg-f-gray-50 py-3 px-4 rounded-xl">
                            В процессе (0)
                        </div>
                        <div className="tag text-f-blue-500 bg-transparent py-3 px-4 rounded-xl">
                            Завершенные
                        </div>
                    </div>
                    <OrderFilter />
                </div>
            </div>
            <div className="box mt-4 bg-f-gray-50 w-full h-full  overflow-y-auto  ">
                <OrdersList orders={orders} />
            </div>
        </div>
    );
}
