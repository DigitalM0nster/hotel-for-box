"use client";

import useAdress, { AdressType } from "@/hooks/useAdress";
import { CloseIco, ErrorIco, Eye, EyeClose, MinusIco, PlusIco } from "@/icons/icons";
import { ChangeEvent, InputHTMLAttributes, TextareaHTMLAttributes, useState } from "react";

type InputTypes =
    | InputHTMLAttributes<HTMLInputElement>["type"]
    | "toggle"
    | "counter"
    | "adress"
    | "textarea";

type InputCostumProps = {
    title?: string;
    error?: string | undefined;
    hideEye?: boolean; //! Скрывать ввод (отображение кнопки глаза)
    type?: InputTypes;
    adressType?: AdressType;
    beforeText?: string;
    afterText?: string;
};
type CustomInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "type"> &
    InputCostumProps;

export function Input(props: CustomInputProps) {
    const { error, hideEye, title, adressType, beforeText, afterText, ...inputProps } = props;
    const [isShowPass, setIsShowPass] = useState(false);
    const eyeToggle = () => setIsShowPass((state) => !state);

    const { input, setInput, list, clearListFn } = useAdress({ adressType });

    //!TEXT-AREA

    if (inputProps.type === "textarea") {
        return (
            <div className="flex flex-col gap-2">
                {title && <div className="body-3 text-f-blue-500">{title}</div>}

                <textarea
                    className="body-3 text-f-blue-950 bg-f-gray-50  p-4 rounded-lg w-full focus:outline-0"
                    {...inputProps}
                />

                {error && <div className="body-3 text-f-error ">{error}</div>}
            </div>
        );
    }

    //!ADRESS  вызывать через Controller
    //Controller даёт полный контроль: value, onChange, ref (надо для изменения value у input после выбора из списка)
    if (inputProps.type === "adress") {
        return (
            <div className="flex flex-col gap-2">
                <div className="body-3 text-f-blue-500">{title}</div>
                <div
                    className={`relative bg-f-gray-50 rounded-lg w-full ${
                        list.length ? "border-1 border-f-accent" : ""
                    }`}
                >
                    <input
                        {...inputProps}
                        onChange={(e) => {
                            setInput({ value: e.target.value, click: false });

                            inputProps.onChange?.(e);
                        }}
                        className="body-2 text-f-blue-950  p-4  w-full "
                    />
                    {!!list.length && (
                        <div
                            className="absolute -bottom-4  translate-y-full border-1 border-f-accent w-full rounded-lg max-h-56 overflow-y-scroll z-10"
                            onMouseLeave={clearListFn}
                        >
                            {list.map((adress) => (
                                <div
                                    key={adress}
                                    className="body-2 bg-f-white-100 py-2.5 lg:py-6 px-3 lg:px-4 cursor-pointer"
                                    onClick={() => {
                                        setInput(() => ({ value: adress, click: true }));

                                        inputProps.onChange?.({
                                            target: { value: adress },
                                            currentTarget: { value: adress },
                                        } as ChangeEvent<HTMLInputElement>);
                                    }}
                                >
                                    {adress}
                                </div>
                            ))}
                        </div>
                    )}
                    {!!list.length && (
                        <CloseIco
                            className="absolute right-2  top-1/2 -translate-y-1/2 cursor-pointer"
                            onClick={clearListFn}
                        />
                    )}
                </div>
                {error && <div className="body-3 text-f-error ">{error}</div>}
            </div>
        );
    }

    //!COUNETR   -- вызывать через Controller
    if (inputProps.type === "counter") {
        return (
            <div className="flex flex-col gap-2">
                <div className="body-3 text-f-blue-500">{title}</div>
                <div className="body-3 text-f-blue-950 bg-f-gray-50 p-4 rounded-lg w-full flex items-center relative">
                    <MinusIco
                        className="*:fill-f-blue-500 cursor-pointer select-none absolute"
                        onClick={() => {
                            inputProps.onChange?.({
                                target: { value: String(Number(inputProps.value) - 1) },
                            } as ChangeEvent<HTMLInputElement>);
                        }}
                    />
                    <input
                        {...inputProps}
                        type="number"
                        className=" appearance-none no-spinner body-3 text-center w-full"
                    />
                    <PlusIco
                        className="*:fill-f-blue-500 cursor-pointer select-none absolute right-4"
                        onClick={() => {
                            inputProps.onChange?.({
                                target: { value: String(Number(inputProps.value) + 1) },
                            } as ChangeEvent<HTMLInputElement>);
                        }}
                    />
                </div>
                {error && <div className="body-3 text-f-error ">{error}</div>}
            </div>
        );
    }

    //! DATE
    if (inputProps.type === "date") {
        return (
            <div className="flex flex-col gap-2">
                <div className="body-3 text-f-blue-500">{title}</div>
                <input
                    {...inputProps}
                    className="body-3 text-f-blue-950 bg-f-gray-50 p-4 rounded-lg w-full "
                />
                {error && <div className="body-3 text-f-error ">{error}</div>}
            </div>
        );
    }

    //! CHECKBOX
    if (inputProps.type === "checkbox") {
        return (
            <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input {...inputProps} className="peer hidden" />
                <div className="w-5 h-5 rounded-md border border-gray-400 peer-checked:bg-f-accent peer-checked:border-blue-600 transition-colors duration-200 flex items-center justify-center">
                    <svg
                        className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <span className="text-sm text-f-blue-500">{title}</span>
            </label>
        );
    }

    //! TOGGLE
    if (inputProps.type === "toggle") {
        return (
            <label
                className={`flex items-center space-x-3 ${
                    inputProps.disabled ? "cursor-not-allowed" : "cursor-pointer"
                } select-none`}
            >
                <input {...{ ...inputProps, type: "checkbox" }} className="peer hidden" />

                <div
                    className={`tag text-f-blue-650 ${
                        inputProps.disabled
                            ? "peer-checked:text-f-blue-disabled"
                            : "peer-checked:text-f-accent"
                    }  `}
                >
                    {title}
                </div>
                <div
                    className={`w-9  h-5 p-0.5 rounded-full flex  bg-f-gray-50 justify-baseline ${
                        inputProps.disabled
                            ? "peer-checked:bg-f-blue-disabled"
                            : "peer-checked:bg-f-accent"
                    } peer-checked:justify-end
                        lg:w-11 lg:h-6
                        xl:w-13 xl:h-7                        
                        `}
                >
                    <div
                        className={`w-4 lg:w-5 h-4 lg:h-5 xl:w-6 xl:h-6 rounded-full bg-f-white-100  `}
                    ></div>
                </div>
            </label>
        );
    }

    if (inputProps.type === "number") {
        return (
            <div className="flex flex-col gap-2">
                {title && <div className="body-3 text-f-blue-500">{title}</div>}
                <div className="w-full relative">
                    <div
                        className={` bg-f-gray-50  p-4 rounded-lg w-full flex gap-2
                                ${error ? "outline-1 outline-f-error" : ""}
                                `}
                    >
                        {beforeText && <div className=" body-3 text-f-blue-950 ">{beforeText}</div>}

                        <input
                            {...inputProps}
                            min={0.01}
                            step="any"
                            className=" w-full body-3 text-f-blue-950 appearance-none no-spinner "
                        />
                        {afterText && <div className=" body-3 text-f-blue-950 ">{afterText}</div>}
                    </div>
                </div>
                {error && <div className="body-3 text-f-error ">{error}</div>}
            </div>
        );
    }

    //! TEXT PASSWORD EMAIL NUMBER
    return (
        <div className="flex flex-col gap-2">
            {title && <div className="body-3 text-f-blue-500">{title}</div>}
            <div className="w-full relative">
                <div
                    className={` bg-f-gray-50  p-4 rounded-lg w-full flex gap-2
                                ${error ? "outline-1 outline-f-error" : ""}
                                `}
                >
                    {beforeText && <div className=" body-3 text-f-blue-950 ">{beforeText}</div>}

                    <input
                        className=" w-full body-3 text-f-blue-950 appearance-none no-spinner "
                        {...{
                            ...inputProps,
                            ...(hideEye
                                ? { type: isShowPass ? "text" : "password" }
                                : { type: inputProps.type || "text" }),
                        }}
                    />
                    {afterText && <div className=" body-3 text-f-blue-950 ">{afterText}</div>}
                </div>
                {hideEye && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {error && <ErrorIco />}
                        <div className="cursor-pointer" onClick={eyeToggle}>
                            {!isShowPass ? <Eye /> : <EyeClose />}
                        </div>
                    </div>
                )}
            </div>
            {error && <div className="body-3 text-f-error ">{error}</div>}
        </div>
    );
}

export { Input as InputProps };
