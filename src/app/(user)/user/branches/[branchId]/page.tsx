import { auth } from "@/auth";
import BranchForm from "@/components/forms/branchForm";
import { getBranchById } from "@/libs/services/branchService";
import { BranchModel } from "@/mongodb/models/branchModel";
import { redirect } from "next/navigation";

export default async function Branch({ params }: { params: Promise<{ branchId: string }> }) {
    const session = await auth();
    if (!session || (session.user.role !== "admin" && session.user.role !== "super"))
        redirect("/login");
    const { branchId } = await params;

    const branch = await getBranchById({ id: branchId });

    return <BranchForm branch={branch} />;
}
