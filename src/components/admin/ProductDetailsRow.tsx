"use client";

import { useState } from "react";
import { IOrderProduct } from "@/mongodb/models/orderModel";
import styles from "@/components/admin/AdminTable.module.scss";

// Клиентский компонент для отображения детальной информации о товаре.
// Показывает основную информацию в строке таблицы, а при клике раскрывает детали.
export default function ProductDetailsRow({ product, index }: { product: IOrderProduct; index: number }) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<>
			<tr className={`${styles.adminTableRow} ${styles.productRowClickable}`} onClick={() => setIsExpanded(!isExpanded)}>
				<td>{index + 1}</td>
				<td>{product.name}</td>
				<td>{product.brand}</td>
				<td>{product.category}</td>
				<td>{product.price}</td>
				<td>{product.quantity}</td>
				<td>{product.weight}</td>
				<td className={styles.productExpandIcon}>
					<span className={styles.productExpandIconInner}>{isExpanded ? "▼" : "▶"}</span>
				</td>
			</tr>
			{isExpanded && (
				<tr className={styles.adminTableRow}>
					<td colSpan={8} className={styles.productDetailsCell}>
						<div className={styles.productDetailsExpanded}>
							<div className={styles.productDetailsGrid}>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Название:</span>
									<span className={styles.productDetailsValue}>{product.name}</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Бренд:</span>
									<span className={styles.productDetailsValue}>{product.brand || "—"}</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Категория:</span>
									<span className={styles.productDetailsValue}>{product.category || "—"}</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Размер:</span>
									<span className={styles.productDetailsValue}>{product.size || "—"}</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Цвет:</span>
									<span className={styles.productDetailsValue}>{product.color || "—"}</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Цена за единицу:</span>
									<span className={styles.productDetailsValue}>{product.price} руб.</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Количество:</span>
									<span className={styles.productDetailsValue}>{product.quantity} шт.</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Вес:</span>
									<span className={styles.productDetailsValue}>{product.weight} кг</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Габариты (Ш × В × Г):</span>
									<span className={styles.productDetailsValue}>
										{product.width_x} × {product.height_y} × {product.depth_z} см
									</span>
								</div>
								<div className={styles.productDetailsRow}>
									<span className={styles.productDetailsLabel}>Общая стоимость:</span>
									<span className={styles.productDetailsValue}>{product.price * product.quantity} руб.</span>
								</div>
							</div>
						</div>
					</td>
				</tr>
			)}
		</>
	);
}
