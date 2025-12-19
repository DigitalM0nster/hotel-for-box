"use client";

import { useRouter } from "next/navigation";

type AdminBackButtonProps = {
	// Позволяем передать внешний класс, чтобы использовать существующие стили.
	className?: string;
};

// Кнопка "назад" для админских страниц.
// Возвращает по истории браузера туда, где пользователь был до этого.
export default function AdminBackButton({ className }: AdminBackButtonProps) {
	const router = useRouter();

	const handleClick = () => {
		// Реальный шаг назад в истории, как кнопка браузера.
		router.back();
	};

	return (
		<button type="button" onClick={handleClick} className={className}>
			Назад
		</button>
	);
}
