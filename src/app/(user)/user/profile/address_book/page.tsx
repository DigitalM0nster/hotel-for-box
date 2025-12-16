import { auth } from "@/auth";
import { getUserWithAdresses } from "@/libs/services/usersService";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserAdressesList from "./UserAdressesList";
import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { IUser } from "@/mongodb/models/userModel";

export default async function AddressBookPage() {
    //TODO пользователь со вссеми адресами для теста , заменить
    const userWithAdresses = await getUserWithAdresses();

    console.log(userWithAdresses);

    return (
        <div className="flex flex-col gap-4 items-start py-2">
            <Link
                href={"address_book/adress_new"}
                className="button-1 bg-f-accent text-f-white-100 rounded-full px-4 py-3 cursor-pointer"
            >
                Добавить адресс получателя +
            </Link>
            <h1 className="text-xl font-bold">Список адресов</h1>
            <UserAdressesList adresses={userWithAdresses?.adresses || []} />
        </div>
    );
}
