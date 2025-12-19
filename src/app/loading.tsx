// Глобальный лоадер для всего приложения.
// Появляется сразу после клика по ссылке/роуту,
// пока Next.js на сервере подготавливает новую страницу.

export default function AppLoading() {
	return (
		<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
			<div>
				<div style={{ marginBottom: "8px", fontSize: "16px", fontWeight: 600 }}>Загружаем страницу…</div>
				<div
					style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid #e5e7eb", borderTopColor: "#2563eb", animation: "spin 0.8s linear infinite" }}
				/>
			</div>
		</div>
	);
}
