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

	// Если передан value, удаляем defaultValue, чтобы избежать конфликта контролируемого/неконтролируемого компонента
	const cleanSelectProps = { ...selectProps };
	if (cleanSelectProps.value !== undefined) {
		delete cleanSelectProps.defaultValue;
	}

	useEffect(() => {
		if (colors) {
			selectProps.onChange?.({
				target: { value: selectedColor },
			} as ChangeEvent<HTMLSelectElement>);
		}
	}, [selectedColor]);

	if (colors) {
		return (
			<div className="colorSelectWrapper">
				{title && <div className="formFieldTitle">{title}</div>}
				<div className="colorSelectBox" onClick={() => setOpen(!open)}>
					<select {...selectProps} hidden />

					{/* Кнопка открытия */}

					<div className="colorSelectToggle">
						<span className="colorSelectValue">
							<span className="colorDot" style={{ backgroundColor: selectedColor }} />
							{selectedColor}
						</span>
						<Caretdown className="selectIcon" />
					</div>

					{/* Выпадающий список */}
					{open && (
						<div className="colorOptions" onMouseLeave={() => setOpen(false)}>
							{COLORS.map((color) => (
								<button
									key={color}
									onClick={() => {
										setSelectedColor(color);
										setOpen(false);
									}}
									className="colorOption"
								>
									<span className="colorDot" style={{ backgroundColor: color }} />
									{color}
								</button>
							))}
						</div>
					)}
				</div>
				{error && <div className="formFieldError">{error}</div>}
			</div>
		);
	}
	return (
		<div className="selectWrapper">
			{title && <div className="formFieldTitle">{title}</div>}
			<div className="selectBox">
				<select className="selectInput" {...cleanSelectProps}>
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
				<Caretdown className="selectIcon" />
			</div>
			{error && <div className="formFieldError">{error}</div>}
		</div>
	);
}
