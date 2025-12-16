"use client";
import { COLORS } from "@/data/constants/colors";
import { Caretdown } from "@/icons/icons";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
interface IOption {
    value: string | number;
    title: string;
}
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    title?: string;
    disabledOption?: string;
    options?: IOption[];
    error?: string | undefined;
    colors?: boolean;
};

export default function Select(props: SelectProps) {
    const { title, options, disabledOption, error, colors, ...selectProps } = props;
    const [selectedColor, setSelectedColor] = useState("black");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (colors) {
            selectProps.onChange?.({
                target: { value: selectedColor },
            } as ChangeEvent<HTMLSelectElement>);
        }
    }, [selectedColor]);

    if (colors) {
        return (
            <div className="flex flex-col gap-2 select-none  cursor-pointer">
                {title && <div className="body-3 text-f-blue-500">{title}</div>}
                <div
                    className="relative w-full body-3 text-f-blue-950 bg-f-gray-50 p-4 rounded-lg outline-0"
                    onClick={() => setOpen(!open)}
                >
                    <select {...selectProps} hidden />

                    {/* Кнопка открытия */}

                    <div className="flex items-center justify-between w-full  rounded bg-transparent cursor-pointer">
                        <span className="flex items-center gap-2">
                            <span
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: selectedColor }}
                            />
                            {selectedColor}
                        </span>
                        <Caretdown className="absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* Выпадающий список */}
                    {open && (
                        <div
                            className="absolute z-10 mt-1 left-4 right-4 bg-white border rounded shadow h-100 overflow-y-auto cursor-pointer"
                            onMouseLeave={() => setOpen(false)}
                        >
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    <span
                                        className="w-4 h-4 rounded-full border"
                                        style={{ backgroundColor: color }}
                                    />
                                    {color}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {error && <div className="body-3 text-f-error ">{error}</div>}
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-2">
            {title && <div className="body-3 text-f-blue-500">{title}</div>}
            <div className="w-full relative">
                <select
                    className="appearance-none body-3 text-f-blue-950 bg-f-gray-50 p-4 rounded-lg w-full outline-0"
                    {...selectProps}
                >
                    {disabledOption && (
                        <option value="" disabled>
                            {disabledOption}
                        </option>
                    )}

                    {options &&
                        options.map(({ title, value }, idx) => (
                            <option key={`${value}-${title}`} value={value}>
                                {title}
                            </option>
                        ))}
                </select>
                <Caretdown className="absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
            {error && <div className="body-3 text-f-error ">{error}</div>}
        </div>
    );
}
