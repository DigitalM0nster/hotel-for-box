"use client";
import { ErrorIco } from "@/icons/icons";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useEffect, useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import Eye from "@/assets/svg/eye.svg";
import EyeClose from "@/assets/svg/eyeClose.svg";

export default function PhoneField({
    inputName,
    required = false,
    inputProps,
}: {
    inputName: string;
    required?: boolean;
    inputProps?: any;
}) {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    const isError = useMemo<boolean>(() => !!error, [error]);
    useEffect(() => {
        if (value.length >= 3) {
            setError(isValidPhoneNumber(`+${value}`) ? "" : "Введите корректный номер");
        }
    }, [value]);
    return (
        <div className="w-full">
            <div className="w-full relative">
                <PhoneInput
                    value={value}
                    onChange={(e) => setValue(e)}
                    country={"ru"}
                    enableSearch
                    inputClass="!w-full !py-2 !pl-12 !pr-4  !rounded-md !focus:outline-none !focus:ring-2 !focus:ring-blue-500 !text-sm !border-none !bg-f-gray-50 "
                    buttonClass="!bg-gray-100  !rounded-l-md !border-none !bg-f-gray-50 "
                    containerClass="!w-full !border-none !bg-f-gray-50 !rounded-[8px] !p-2"
                    dropdownClass="!absolute !z-50 !bg-white  !shadow-lg !text-sm !max-h-60 !overflow-y-auto !border-none !bg-f-gray-50"
                    placeholder="Введите номер"
                    inputProps={{
                        name: inputName,
                        required,
                        //autoComplete: "tel",
                        ...inputProps,
                    }}
                />
                {isError && <ErrorIco className="absolute right-2 top-1/2 -translate-y-1/2" />}
            </div>
            {error && <div className="body-3 text-f-error ">{error}</div>}
        </div>
    );
}
