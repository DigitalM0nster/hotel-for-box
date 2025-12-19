import Header from "@/components/html/Header/Header";
import UserInfo from "@/components/common/UserInfo/UserInfo";
import styles from "./styles.module.scss";

import Link from "next/link";
import { UserAsideLinkMenu, UserFooterLinkMenu } from "@/components/html/UserLinkMenu/UserLinkMenu";

import { auth } from "@/auth";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	const { user } = session!;
	return (
		<div className={`mycontainer_admin ${styles.userLayoutWrapper}`}>
			<Header className={styles.headerMobile} />
			<header className={styles.header}>
				<div className={styles.sidebar}>
					<div className={styles.sidebarContent}>
						<Link href={"/"}>
							<img src={"/logo.svg"} alt="Hotel4Box logo" className={styles.logoImage} />
						</Link>

						<UserInfo />
					</div>
					<UserAsideLinkMenu />
				</div>
			</header>
			<main className={`box ${styles.mainContent}`}>
				<div className={styles.topChopper} />
				{children}
				<div className={styles.bottomChopper} />
			</main>
			<footer className={styles.footerMobile}>
				<UserFooterLinkMenu />
			</footer>
		</div>
	);
}
