import { ErrorIco } from "@/icons/icons";
import PhoneInput from "react-phone-input-2";

/**
 * Простой компонент телефона для использования без react-hook-form
 * Позволяет выбрать страну с кодом телефона через выпадающий список
 * Использует библиотеку react-phone-input-2 для выбора страны и ввода номера
 *
 * Принимает стандартные пропсы контролируемого компонента:
 * - value: текущее значение телефона (в формате с кодом страны, например "71234567890")
 * - onChange: функция для обновления значения
 * - title: заголовок поля (опционально)
 * - error: сообщение об ошибке (опционально)
 * - placeholder: подсказка в поле ввода (опционально)
 * - disabled: отключить поле (опционально)
 */
type PhoneSimpleProps = {
	value: string;
	onChange: (value: string) => void;
	title?: string;
	error?: string;
	placeholder?: string;
	disabled?: boolean;
};

export default function PhoneSimple(props: PhoneSimpleProps) {
	const { title, error, placeholder = "Введите номер", value, onChange, disabled } = props;

	return (
		<div className="phoneWrapper">
			{title && <div className="phoneTitle">{title}</div>}
			<div className="inputContainer">
				<PhoneInput
					value={value}
					onChange={onChange}
					country={"ru"}
					inputClass="inputElement"
					buttonClass="buttonElement"
					containerClass={`container ${error ? "containerError" : ""}`}
					dropdownClass="dropdown"
					placeholder={placeholder}
					enableSearch
					disabled={disabled}
				/>
				{error && <ErrorIco className="errorIcon" />}
			</div>
			{error && <p className="phoneError">{error}</p>}
		</div>
	);
}
