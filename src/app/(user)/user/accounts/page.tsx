import UsersTable from "@/components/tables/TableTest";
import SuggestTest from "@/components/TEST/SuggestTest";
import { Input } from "@/components/ui/FormElements/Input";

export default function AccountsPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1>accounts</h1>
            {/* <SuggestTest /> */}
            <Input name="counter" type="counter" title="Counter" />
            <UsersTable />
        </div>
    );
}
