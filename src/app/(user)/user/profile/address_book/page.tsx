import { getUserWithAdresses } from "@/libs/services/usersService";
import Link from "next/link";
import UserAdressesList from "./UserAdressesList";
import { progectPathes } from "@/config/pathes";
import styles from "@/components/lists/OrdersList/OrdersList.module.scss";

export default async function AddressBookPage() {
	//TODO пользователь со вссеми адресами для теста , заменить
	const userWithAdresses = await getUserWithAdresses();

	return (
		<div className={styles.listWrapper}>
			<UserAdressesList adresses={userWithAdresses?.adresses || []} />
			<div style={{ marginTop: "16px" }}>
				<Link href={progectPathes.address_book.path + "/adress_new"} className={styles.createButton}>
					<span className={styles.createButtonText}>Добавить адрес получателя</span>
				</Link>
			</div>
		</div>
	);
}
