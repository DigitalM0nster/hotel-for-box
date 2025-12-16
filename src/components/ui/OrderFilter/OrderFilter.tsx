"use client";

import { CloseIco, ParamsIco } from "@/icons/icons";
import { useState } from "react";

export default function OrderFilter() {
    const [isShowFilterMenu, setIsShowFilterMenu] = useState(false);
    const filterMenuShowToggle = () => setIsShowFilterMenu((state) => !state);
    return (
        <div className="flex gap-2 relative">
            <input
                type="text"
                placeholder="Поиск: отслеживание, id, название"
                className="body-3 bg-f-gray-50 px-4 rounded-lg w-full min-w-[290px]"
            />
            <div
                className={`flex items-center p-3 bg-f-gray-50 rounded-lg cursor-pointer
                    ${isShowFilterMenu ? "**:fill-f-accent" : ""}`}
                onClick={filterMenuShowToggle}
            >
                <ParamsIco />
            </div>

            {/* ФИЛЬТРЫ МЕНЮ */}
            {isShowFilterMenu && (
                <div
                    className="fixed inset-0 flex flex-col gap-5 bg-f-white-100  py-6 px-5 rounded-lg shadow-2xl w-full
                                        md:absolute md:inset-auto md:bottom-[-8px] md:right-0 md:translate-y-full
                                        z-10                                        
                                        "
                >
                    <div className="flex justify-between" onClick={filterMenuShowToggle}>
                        <div className="h3 text-f-blue-950">Фильтры</div>
                        <CloseIco className={`cursor-pointer `} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="body-3 text-f-blue-500">Название товара</div>
                        <input
                            type="text"
                            className="body-3 bg-f-gray-50 px-3 py-4 rounded-lg w-full"
                            placeholder="Название товара"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="body-3 text-f-blue-500">Номер отслеживания</div>
                        <input
                            type="text"
                            className="body-3 bg-f-gray-50 px-3 py-4 rounded-lg w-full"
                            placeholder="Название товара"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="body-3 text-f-blue-500">Номер отслеживания</div>
                        <input
                            type="text"
                            className="body-3 bg-f-gray-50 px-3 py-4 rounded-lg w-full"
                            placeholder="Название товара"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="body-3 text-f-blue-500">Номер отслеживания</div>
                        <input
                            type="text"
                            className="body-3 bg-f-gray-50 px-3 py-4 rounded-lg w-full"
                            placeholder="Название товара"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="body-3 text-f-blue-500">Номер отслеживания</div>
                        <input
                            type="text"
                            className="body-3 bg-f-gray-50 px-3 py-4 rounded-lg w-full"
                            placeholder="Название товара"
                        />
                    </div>
                    <div className=" flex gap-4 mt-auto ">
                        <div className="button-2 px-6 py-3 rounded-full bg-f-accent text-f-white-100 cursor-pointer flex-1 text-center">
                            Применить
                        </div>
                        <div className="button-2 px-6 py-3 rounded-full bg-transparent text-f-blue-500 border border-f-blue-500 cursor-pointer flex-1 text-center">
                            Сбросить
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
