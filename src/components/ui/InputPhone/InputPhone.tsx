"use client";
import { ErrorIco } from "@/icons/icons";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useEffect, useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Eye from "@/assets/svg/eye.svg";
import EyeClose from "@/assets/svg/eyeClose.svg";

export default function PhoneField({ inputName, required = false, inputProps }: { inputName: string; required?: boolean; inputProps?: any }) {
	const [value, setValue] = useState("");
	const [error, setError] = useState("");

	const isError = useMemo<boolean>(() => !!error, [error]);
	useEffect(() => {
		if (value.length >= 3) {
			setError(isValidPhoneNumber(`+${value}`) ? "" : "Введите корректный номер");
		}
	}, [value]);
	return (
		<div className="phoneWrapper">
			<div className="inputContainer">
				<PhoneInput
					value={value}
					onChange={(e) => setValue(e)}
					country={"ru"}
					enableSearch
					inputClass="inputElement"
					buttonClass="buttonElement"
					containerClass={`container ${isError ? "containerError" : ""}`}
					dropdownClass="dropdown"
					placeholder="Введите номер"
					inputProps={{
						name: inputName,
						required,
						//autoComplete: "tel",
						...inputProps,
					}}
				/>
				{isError && <ErrorIco className="errorIcon" />}
			</div>
			{error && <div className="phoneError">{error}</div>}
		</div>
	);
}
