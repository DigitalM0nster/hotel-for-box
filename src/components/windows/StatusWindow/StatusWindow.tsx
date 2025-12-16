"use client";

import { useState } from "react";

import CloseIco from "@/assets/svg/icon-close.svg";
import Image from "next/image";

type IStatus = "silver" | "gold" | "platinum";

export default function StatusWindow({ status }: { status: IStatus }) {
    const [isShow, setIsShow] = useState(true);

    const closeWindow = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.target === event.currentTarget && setIsShow(false);
    };

    const Svg = ({ selected, className }: { selected: boolean; className?: string }) => (
        <svg
            width="16"
            height="16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" fill="white"></rect>
            <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="#56688E"></rect>
            <circle cx="8" cy="8" r="4" fill={selected ? "#0059ff" : "#56688E"}></circle>
        </svg>
    );
    return (
        isShow && (
            <div
                className="fixed inset-0 flex  bg-black/40
                            md:justify-center
                            "
                onClick={closeWindow}
            >
                <div
                    className="boxNoPadding flex bg-white  w-full self-end translate-y-5
                                md:w-auto md:self-center
                                "
                >
                    <CloseIco
                        className="absolute right-4 top-4
                                        lg:hidden
                                        "
                        onClick={closeWindow}
                    />
                    <div className="box">
                        <div className="pt-4">
                            <div
                                className={`flex flex-col gap-2 border-l-1 ${
                                    status === "silver" ||
                                    status === "gold" ||
                                    status === "platinum"
                                        ? "border-f-accent"
                                        : ""
                                } relative pl-4 pb-8 w-59
                            md:w-94
                            `}
                            >
                                <Svg
                                    selected={status === "silver"}
                                    className="absolute left-0 top-0 -translate-x-1/2 "
                                />

                                <div className="h4 text-f-blue-950">Серебряный</div>
                                <div className="body-3 text-f-blue-950">
                                    На Серебряном уровне вы получаете скидку 5% на доставку при
                                    оформлении более 5 заказов в месяц. Экономьте на покупках и
                                    наслаждайтесь удобным сервисом!
                                </div>
                            </div>
                            <div
                                className={`flex flex-col gap-2 border-l-1 ${
                                    status === "gold" || status === "platinum"
                                        ? "border-f-accent"
                                        : ""
                                } relative pl-4 pb-8 w-59
                            md:w-94
                            `}
                            >
                                <Svg
                                    selected={status === "gold"}
                                    className="absolute left-0 top-0 -translate-x-1/2 "
                                />

                                <div className="h4 text-f-blue-950">Золотой</div>
                                <div className="body-3 text-f-blue-950">
                                    Золотой уровень – это наша благодарность за вашу лояльность.
                                    Получайте скидку 10% на доставку, оформляя более 10 заказов в
                                    месяц.
                                </div>
                            </div>
                            <div
                                className={`flex flex-col gap-2 border-l-1 ${
                                    status === "platinum" ? "border-f-accent" : ""
                                } relative pl-4 pb-8 w-59
                            md:w-94
                            `}
                            >
                                <Svg
                                    selected={status === "platinum"}
                                    className="absolute left-0 top-0 -translate-x-1/2 "
                                />

                                <div className="h4 text-f-blue-950">Платиновый</div>
                                <div className="body-3 text-f-blue-950">
                                    Платиновый уровень – для наших самых активных клиентов. Ваша
                                    лояльность вознаграждается максимальной скидкой 15% на доставку
                                    при оформлении более 30 заказов в месяц.
                                </div>
                            </div>
                        </div>
                    </div>

                    <Image
                        src={"/png/boxes2.png"}
                        width={500}
                        height={600}
                        alt="boxes"
                        priority
                        className="boxNoPadding hidden w-fit h-fit object-fill bg-f-accent
                        lg:block
                        "
                    />
                </div>
            </div>
        )
    );
}
