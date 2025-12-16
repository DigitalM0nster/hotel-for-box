import { auth } from "@/auth";
import AdressFrom from "@/components/forms/adressFrom";
import { getAdressById } from "@/libs/services/adressService";
import { redirect } from "next/navigation";

export default async function AdressPage({ params }: { params: Promise<{ adressId: string }> }) {
    const { adressId } = await params;
    const session = await auth();
    if (!session) redirect("/login");

    const { user } = session;

    const adress = await getAdressById({ id: adressId });

    return <AdressFrom adress={adress} userId={user.id} />;
}
