import AddCardFormWrapper from "@/components/forms/addCardForm";
import UserCard from "./UserCard";

//TODO Only plain objects can be passed to Client Components from Server Components. - где-то здесь
export default function PaymentProfilePage() {
    return (
        <div className="flex flex-col gap-4">
            <h1>PaymentProfilePage</h1>
            <AddCardFormWrapper />
            <UserCard />
        </div>
    );
}
