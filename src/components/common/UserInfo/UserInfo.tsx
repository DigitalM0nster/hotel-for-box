import { auth } from "@/auth";
import CircleProgress from "@/components/ui/CircleProgress/CircleProgress";
import styles from "./styles.module.scss";
import Link from "next/link";

interface IUserInfoProps {
	// name: string;
	// userName: string;
	// balance: number;
	// status: number;
	className?: string;
}

export default async function UserInfo(props: IUserInfoProps) {
	const { className = "" } = props;
	// Получаем данные сессии, чтобы показать имя и почту пользователя
	const session = await auth();
	const { user } = session!;
	return (
		<div className={`${styles.userInfoWrapper} ${className}`}>
			<CircleProgress value={23} strokeWidth={15} className={styles.userInfoProgress} />
			<div className={styles.userInfoGreeting}>Привет, {`${user.name} ${user.surname}`}</div>
			<div className={styles.userInfoRow}>
				<div className={styles.userInfoLabel}>Пользователь:</div>
				<div className={styles.userInfoValue}>{user.email}</div>
			</div>
			<div className={styles.userInfoRow}>
				<div className={styles.userInfoLabel}>Баланс:</div>
				<div className={styles.userInfoValue}>${Number(0).toFixed(2)}</div>
			</div>
			{user.role != "user" && (
				<div className={styles.userInfoRow}>
					<Link href="/admin" className={styles.userInfoLabel}>
						Перейти в админ-панель
					</Link>
				</div>
			)}
		</div>
	);
}
