import { auth } from "@/auth";
import StatusMsg from "@/components/windows/StatusWindow/StatusWindow";

export default async function UserPage() {
    const user = await auth();

    return (
        <div>
            <h1>User</h1>
            <StatusMsg status="platinum" />
            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    );
}
