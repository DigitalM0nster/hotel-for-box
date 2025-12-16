import { auth } from "@/auth";
import UpdateUserForm from "@/components/forms/updateUserForm";
import { GetUserFromCurrentSession } from "@/helpers/db/auth";
import { Suspense } from "react";

export default async function PersonalInformationPage() {
    const { user } = await GetUserFromCurrentSession();

    return <UpdateUserForm user={user} />;
}
