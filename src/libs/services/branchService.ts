"use server";

import { normalizeDbRes } from "@/helpers/db/forDbFuncs";
import { connectDB } from "@/mongodb/connect";
import { BranchModel, IBranch } from "@/mongodb/models/branchModel";
import { IActionResult } from "@/types/types";

export const createBranch = async (branch: IBranch): Promise<IActionResult> => {
    try {
        await connectDB();
        const newBranch = new BranchModel();
        Object.assign(newBranch, branch);

        await newBranch.save();
        return { type: "success", message: "Отдел успешно добавлен" };
    } catch (error) {
        if (error instanceof Error) {
            return { type: "warning", message: error.message };
        }
        return { type: "error", message: "Ошибка операции, повторите позже." };
    }
};
export const updateBranch = async ({
    branch,
    updatedId,
}: {
    branch: IBranch;
    updatedId: string;
}): Promise<IActionResult> => {
    try {
        await connectDB();
        const updatedBranch = await BranchModel.findOne({ _id: updatedId });
        if (!updatedBranch) return { type: "error", message: "Адресс не найден" };

        Object.assign(updatedBranch, branch);

        await updatedBranch.save();
        return { type: "success", message: "Отдел успешно обновлен" };
    } catch (error) {
        if (error instanceof Error) {
            return { type: "warning", message: error.message };
        }
        return { type: "error", message: "Ошибка операции, повторите позже." };
    }
};

export const getBranchesAll = async (): Promise<IBranch[]> => {
    try {
        await connectDB();
        const branches = await BranchModel.find();
        return normalizeDbRes<IBranch[]>(branches);
    } catch (error) {
        return [];
    }
};

export const getBranchById = async ({ id }: { id: string }): Promise<IBranch | null> => {
    try {
        await connectDB();
        const branch = await BranchModel.findById({ _id: id });

        return normalizeDbRes<IBranch>(branch);
    } catch (error) {
        return null;
    }
};
