"use client";

import { CloseIco } from "@/icons/icons";
import { useCallback, useEffect, useState } from "react";
import { useDebounce, useDebouncedCallback } from "use-debounce";
import useAdress from "../../hooks/useAdress";

export default function SuggestTest() {
    const { input, setInput, list, clearListFn } = useAdress();

    return (
        <div
            className={`relative bg-f-gray-50 rounded-lg w-full ${
                list.length ? "border-1 border-f-accent" : ""
            }`}
        >
            <input
                value={input.value}
                onChange={(e) =>
                    setInput(() => ({ value: e.target.value.trimStart(), click: false }))
                }
                className="body-2 text-f-blue-950  p-4  w-full "
            />
            {!!list.length && (
                <div className="absolute -bottom-4  translate-y-full border-1 border-f-accent w-full rounded-lg max-h-56 overflow-y-scroll">
                    {list.map((adress) => (
                        <div
                            key={adress}
                            className="body-2 bg-f-white-100 py-2.5 lg:py-6 px-3 lg:px-4 cursor-pointer"
                            onClick={() => setInput(() => ({ value: adress, click: true }))}
                        >
                            {adress}
                        </div>
                    ))}
                </div>
            )}
            {!!list.length && (
                <CloseIco
                    className="absolute right-2  top-1/2 -translate-y-1/2 "
                    onClick={clearListFn}
                />
            )}
        </div>
    );
}
