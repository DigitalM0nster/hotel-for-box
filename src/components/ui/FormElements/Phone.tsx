import { ErrorIco } from "@/icons/icons";
import PhoneInput from "react-phone-input-2";

type PhoneProps = {
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    value: string;
    disabled?: boolean;

    ref: (instance: any) => void;
} & {
    title?: string;
    error?: string | undefined;
    placeholder?: string;
};

export default function PhoneControled(props: PhoneProps) {
    const { title, error, placeholder = "", ...fieldProps } = props;
    return (
        <div className="flex flex-col gap-2">
            {title && <div className="body-3 text-f-blue-500">{title}</div>}
            <div className="w-full relative">
                <PhoneInput
                    {...fieldProps}
                    country={"ru"}
                    inputClass="!w-full !py-2 !pl-12 !pr-4  !rounded-md !focus:outline-none !focus:ring-2 !focus:ring-blue-500 !text-sm !border-none !bg-f-gray-50 "
                    buttonClass="!bg-gray-100  !rounded-l-md !border-none !bg-f-gray-50  selected:!bg-f-gray-50 "
                    containerClass={`!w-full !border-none !bg-f-gray-50 !rounded-[8px] !p-2 ${
                        error ? "!outline-1 !outline-f-error" : ""
                    }`}
                    dropdownClass="!absolute !z-50 !bg-white  !shadow-lg !text-sm !max-h-60 !overflow-y-auto !border-none !bg-f-gray-50"
                    placeholder={placeholder}
                    enableSearch
                />
                {error && <ErrorIco className="absolute right-2 top-1/2 -translate-y-1/2 " />}
            </div>
            {error && <p className="body-3 text-f-error ">{error}</p>}
        </div>
    );
}
