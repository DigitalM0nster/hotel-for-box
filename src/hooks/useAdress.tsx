"use client";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

//TODO Сделать атокомплит по адресам и городам
//https://developer.tech.yandex.ru/
//https://yandex.ru/maps-api/docs/suggest-api/request.html
//https://yandex.ru/maps-api/docs/suggest-api/examples.html

const SUG_KEY = process.env.NEXT_PUBLIC_YANDEX_SUGGEST_MAPS_KEY;

export interface YandexSuggestResponse {
	results?: SuggestResult[];
}

export interface SuggestResult {
	title: HighlightedText;
	subtitle?: HighlightedText;
	tags?: string[];
	distance?: {
		text: string;
		value: number;
	};
	address?: {
		formatted_address: string;
		component?: AddressComponent[];
	};
	uri?: string;
}

export interface HighlightedText {
	text: string;
	hl?: [number, number][];
}

export type AddressComponentKind =
	| "COUNTRY"
	| "PROVINCE"
	| "AREA"
	| "LOCALITY"
	| "STREET"
	| "HOUSE"
	| "ENTRANCE"
	| "FLAT"
	| "ROOM"
	| "METRO"
	| "RAILWAY_STATION"
	| "VEGETATION"
	| "HYDRO"
	| "OTHER";

export interface AddressComponent {
	name: string;
	kind: AddressComponentKind;
}

type InputType = { value: string; click: boolean };

export type AdressType = "country" | "locality" | "house" | undefined;

//! ПРинемает сроку и с задержкой после остановки ввода дает лист вариантов
export default function useAdress({
	suggestKey = "", // API KEY
	adressType, //Страна / Город / Дом
}: {
	suggestKey?: string;
	adressType?: AdressType;
} = {}) {
	const yaSuggestKey = suggestKey || SUG_KEY || "";
	const [input, setInput] = useState<InputType>({
		value: "",
		click: false,
	});
	const [list, setList] = useState<string[]>([]);
	const clearListFn = () => setList(() => []);

	const getAdresses = async (str: string) => {
		// Проверяем наличие ключа API
		if (!yaSuggestKey) {
			console.warn("Yandex Suggest API key не задан");
			return;
		}

		// Проверяем, что строка не пустая
		if (!str || str.trim().length === 0) {
			setList([]);
			return;
		}

		try {
			const response = await fetch(
				`https://suggest-maps.yandex.ru/v1/suggest?print_address=1${adressType ? `&types=${adressType}` : ""}&text=${encodeURIComponent(
					str
				)}&lang=ru&apikey=${yaSuggestKey}`
			);

			// Проверяем успешность запроса
			if (!response.ok) {
				console.error("Ошибка запроса к Yandex Suggest API:", response.status, response.statusText);
				return;
			}

			const res: YandexSuggestResponse = await response.json();

			if (!res.results || !res.results.length) {
				setList([]);
				return;
			}

			const resArr = res.results
				.map(
					({ address }) =>
						address?.component &&
						//TODO выводить только ~ улицу , без указания города
						address.component.reduce<string>((acc, { kind, name }) => {
							return `${acc ? acc + "," : ""} ${name}`;
						}, ``)
				)
				.filter((el) => el) as string[];

			setList(resArr);
		} catch (error) {
			// Обрабатываем ошибки сети или парсинга
			console.error("Ошибка при получении подсказок адресов:", error);
			setList([]);
		}
	};

	const [debounceInput] = useDebounce(input, 500);

	useEffect(() => {
		// Не делаем запрос, если нет API ключа
		if (!yaSuggestKey) {
			return;
		}

		if (!debounceInput.click && debounceInput.value.trim().length > 0) {
			getAdresses(debounceInput.value);
		} else {
			clearListFn();
		}
	}, [debounceInput, yaSuggestKey]);

	return { input, setInput, list, clearListFn };
}
