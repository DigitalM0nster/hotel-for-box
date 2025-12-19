// Утилиты для работы с датами

/**
 * Получает первый день текущего месяца в формате YYYY-MM-DD
 * @returns Строка в формате YYYY-MM-DD (например, "2024-01-01")
 */
export function getFirstDayOfCurrentMonth(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0"); // Месяц от 1 до 12
	const day = "01"; // Первый день месяца
	return `${year}-${month}-${day}`;
}

/**
 * Получает последний день текущего месяца в формате YYYY-MM-DD
 * @returns Строка в формате YYYY-MM-DD (например, "2024-01-31")
 */
export function getLastDayOfCurrentMonth(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1; // Месяц от 1 до 12

	// Создаём дату следующего месяца и вычитаем один день, чтобы получить последний день текущего месяца
	const lastDay = new Date(year, month, 0); // День 0 = последний день предыдущего месяца

	const monthStr = String(month).padStart(2, "0");
	const dayStr = String(lastDay.getDate()).padStart(2, "0");

	return `${year}-${monthStr}-${dayStr}`;
}
