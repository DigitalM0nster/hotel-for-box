"use client";
import { IAdress } from "@/mongodb/models/adressModel";
import Link from "next/link";

//TODO Стилизовать список адресов
export default function UserAdressesList({ adresses }: { adresses: IAdress[] }) {
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="box flex flex-col gap-2 bg-f-gray-30">
                {adresses.map((adress) => (
                    <Link
                        href={`/user/profile/address_book/${adress._id}`}
                        key={adress._id}
                        className="box bg-f-white-100"
                    >
                        {adress.isBusiness ? (
                            <div>
                                <div>{adress.companyName}</div>
                            </div>
                        ) : (
                            <div className="flex">
                                <div>{adress.recipientName}</div>
                                <div>{adress.recipientSurname}</div>
                                <div>{adress.recipientPatronymic}</div>
                            </div>
                        )}
                        <div className="flex gap-0.5">
                            <div>{adress.country}</div>
                            <div>{adress.city}</div>
                            <div>{adress.adress}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
