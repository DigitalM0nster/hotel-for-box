import { auth } from "@/auth";
import { progectPathes } from "@/config/pathes";
import { UserIco } from "@/icons/icons";
import Link from "next/link";
import styles from "./Header.module.scss";

export default async function Header({ className = "" }: { className?: string }) {
	const session = await auth();

	return (
		<header className={`${styles.headerWrapper} ${className}`}>
			<div className={styles.headerInner}>
				<Link href={"/"}>
					<img src={"/logo.svg"} alt="Hotel4Box logo" className={styles.logoImage} />
				</Link>
				<div className={styles.actions}>
					<Link href={"/user/track"} className={styles.trackLink}>
						Отследить посылку
					</Link>
					{session?.user ? (
						<Link href={progectPathes.personal_information.path}>
							<UserIco />
						</Link>
					) : (
						<>
							<Link href={"/login"} className={styles.loginLink}>
								Войти
							</Link>
							<Link href={"/register"} className={styles.registerButton}>
								Регистрация
							</Link>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
