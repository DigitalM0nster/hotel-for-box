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
		<div className="phoneWrapper">
			{title && <div className="phoneTitle">{title}</div>}
			<div style={{ position: "relative", width: "100%" }}>
				<PhoneInput
					{...fieldProps}
					country={"ru"}
					// Добавляем класс error на сам текстовый инпут телефонного поля, если есть ошибка.
					inputClass={`inputElement ${error ? "error" : ""}`}
					buttonClass="buttonElement"
					containerClass={`container ${error ? "containerError" : ""}`}
					dropdownClass="dropdown"
					placeholder={placeholder}
					enableSearch
				/>
				{error && <ErrorIco className="errorIcon" />}
			</div>
			{error && <p className="phoneError">{error}</p>}
		</div>
	);
}
