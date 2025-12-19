"use client";

import useAdress, { AdressType } from "@/hooks/useAdress";
import { CloseIco, ErrorIco, Eye, EyeClose, MinusIco, PlusIco } from "@/icons/icons";
import { ChangeEvent, InputHTMLAttributes, TextareaHTMLAttributes, useRef, useState } from "react";
type InputTypes = InputHTMLAttributes<HTMLInputElement>["type"] | "toggle" | "counter" | "adress" | "textarea";

type InputCostumProps = {
	title?: string;
	error?: string | undefined;
	hideEye?: boolean; //! Скрывать ввод (отображение кнопки глаза)
	type?: InputTypes;
	adressType?: AdressType;
	beforeText?: string;
	afterText?: string;
};
type CustomInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "type"> & InputCostumProps;

export function Input(props: CustomInputProps) {
	const { error, hideEye, title, adressType, beforeText, afterText, ...inputProps } = props;
	const [isShowPass, setIsShowPass] = useState(false);
	const eyeToggle = () => setIsShowPass((state) => !state);

	// ref нужен для безопасного вызова showPicker у даты
	const dateInputRef = useRef<HTMLInputElement | null>(null);
	const tryOpenDatePicker = () => {
		const el = dateInputRef.current;
		if (el && typeof el.showPicker === "function") {
			try {
				el.showPicker();
			} catch (err) {
				// если браузер запрещает (без явного клика), просто игнорируем
			}
		}
	};

	const { input, setInput, list, clearListFn } = useAdress({ adressType });

	//!TEXT-AREA

	if (inputProps.type === "textarea") {
		return (
			<div className="formField">
				{title && <div className="formFieldTitle">{title}</div>}

				{/* Добавляем класс error для визуальной подсветки поля с ошибкой */}
				<textarea className={`formTextarea ${error ? "error" : ""}`} {...inputProps} />

				{error && <div className="formFieldError">{error}</div>}
			</div>
		);
	}

	//!ADRESS  вызывать через Controller
	//Controller даёт полный контроль: value, onChange, ref (надо для изменения value у input после выбора из списка)
	if (inputProps.type === "adress") {
		return (
			<div className="formField">
				{title && <div className="formFieldTitle">{title}</div>}
				<div className={`formAdressShell ${list.length ? "formAdressShellActive" : ""}`}>
					<input
						{...inputProps}
						onChange={(e) => {
							setInput({ value: e.target.value, click: false });

							inputProps.onChange?.(e);
						}}
						className={`formAdressInput ${error ? "error" : ""}`}
					/>
					{!!list.length && (
						<div className="formAdressDropdown" onMouseLeave={clearListFn}>
							{list.map((adress) => (
								<div
									key={adress}
									className="formAdressOption"
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
					{!!list.length && <CloseIco className="formAdressClear" onClick={clearListFn} />}
				</div>
				{error && <div className="formFieldError">{error}</div>}
			</div>
		);
	}

	//!COUNETR   -- вызывать через Controller
	if (inputProps.type === "counter") {
		return (
			<div className="formField">
				{title && <div className="formFieldTitle">{title}</div>}
				<div className="formCounterShell">
					<MinusIco
						className="formCounterIcon"
						onClick={() => {
							inputProps.onChange?.({
								target: { value: String(Number(inputProps.value) - 1) },
							} as ChangeEvent<HTMLInputElement>);
						}}
					/>
					<input {...inputProps} type="number" className={`formCounterInput ${error ? "error" : ""}`} />
					<PlusIco
						className="formCounterIconPlus"
						onClick={() => {
							inputProps.onChange?.({
								target: { value: String(Number(inputProps.value) + 1) },
							} as ChangeEvent<HTMLInputElement>);
						}}
					/>
				</div>
				{error && <div className="formFieldError">{error}</div>}
			</div>
		);
	}

	//! DATE
	if (inputProps.type === "date") {
		return (
			<div className="formField">
				{title && <div className="formFieldTitle">{title}</div>}
				<input
					{...inputProps}
					ref={dateInputRef}
					onClick={(e) => {
						tryOpenDatePicker();
						inputProps.onClick?.(e);
					}}
					onFocus={(e) => {
						tryOpenDatePicker();
						inputProps.onFocus?.(e);
					}}
					style={{ cursor: "text" }}
					className={`formBaseInput ${error ? "error" : ""}`}
				/>
				{error && <div className="formFieldError">{error}</div>}
			</div>
		);
	}

	//! CHECKBOX
	if (inputProps.type === "checkbox") {
		return (
			<label className="formCheckboxLabel">
				<input {...inputProps} className="formCheckboxHidden" />
				<span className="formCheckboxBox" aria-hidden="true">
					<svg className="formCheckboxIcon" viewBox="0 0 20 20" fill="none">
						<path d="M15.8333 6.25L8.125 13.9583L4.16666 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
				<span className="formCheckboxText">{title}</span>
			</label>
		);
	}

	//! TOGGLE
	if (inputProps.type === "toggle") {
		return (
			<label className={`formToggleLabel ${inputProps.disabled ? "formToggleDisabled" : ""}`}>
				<input {...{ ...inputProps, type: "checkbox" }} className="formToggleHidden" />

				<div className={`formToggleText ${inputProps.disabled ? "formToggleTextDisabled" : ""}`}>{title}</div>
				<div className={`formToggleTrack ${inputProps.disabled ? "formToggleTrackDisabled" : ""}`}>
					<div className="formToggleThumb"></div>
				</div>
			</label>
		);
	}

	if (inputProps.type === "number") {
		// Если есть beforeText или afterText, нужен контейнер для flex
		if (beforeText || afterText) {
			return (
				<div className="formField">
					{title && <div className="formFieldTitle">{title}</div>}
					<div className={`formInputShell ${error ? "formInputShellError" : ""}`}>
						{beforeText && <span className="formInputAffix">{beforeText}</span>}
						<input {...inputProps} min={0.01} step="any" className={`formInputCore ${error ? "error" : ""}`} />
						{afterText && <span className="formInputAffix">{afterText}</span>}
					</div>
					{error && <div className="formFieldError">{error}</div>}
				</div>
			);
		}
		// Без beforeText/afterText - просто инпут
		return (
			<div className="formField">
				{title && <div className="formFieldTitle">{title}</div>}
				<input
					{...inputProps}
					min={0.01}
					step="any"
					className={`formBaseInput ${error ? "error" : ""}`}
					style={error ? { outline: "1px solid var(--color-f-error, #ff3737)" } : undefined}
				/>
				{error && <div className="formFieldError">{error}</div>}
			</div>
		);
	}

	//! TEXT PASSWORD EMAIL NUMBER
	// Если есть beforeText или afterText, нужен контейнер для flex
	if (beforeText || afterText) {
		return (
			<div className="formField">
				{title && <div className="formFieldTitle">{title}</div>}
				<div className={`formInputShell ${error ? "formInputShellError" : ""}`}>
					{beforeText && <span className="formInputAffix">{beforeText}</span>}
					<input
						className={`formInputCore ${error ? "error" : ""}`}
						{...{
							...inputProps,
							...(hideEye ? { type: isShowPass ? "text" : "password" } : { type: inputProps.type || "text" }),
						}}
					/>
					{afterText && <span className="formInputAffix">{afterText}</span>}
				</div>
				{error && <div className="formFieldError">{error}</div>}
			</div>
		);
	}

	// Без beforeText/afterText - просто инпут без врапперов
	// Для formEyeControls нужен relative контейнер, используем inline style чтобы не редактировать CSS
	return (
		<div className="formField">
			{title && <div className="formFieldTitle">{title}</div>}
			<div style={{ position: "relative", width: "100%" }}>
				<input
					className={`formBaseInput ${error ? "error" : ""}`}
					style={error ? { outline: "1px solid var(--color-f-error, #ff3737)" } : undefined}
					{...{
						...inputProps,
						...(hideEye ? { type: isShowPass ? "text" : "password" } : { type: inputProps.type || "text" }),
					}}
				/>
				{hideEye && (
					<div className="formEyeControls">
						{error && <ErrorIco />}
						<div className="formEyeToggle" onClick={eyeToggle}>
							{!isShowPass ? <Eye /> : <EyeClose />}
						</div>
					</div>
				)}
			</div>
			{error && <div className="formFieldError">{error}</div>}
		</div>
	);
}

export { Input as InputProps };
