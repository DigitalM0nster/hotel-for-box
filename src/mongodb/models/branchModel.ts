import { model, Model, models, Schema } from "mongoose";

export interface IBranch {
    _id?: string;
    title: string;
    branchId: string;
    adress: string;
    city: string;
    zip_code: string;
    workTime: {
        from: string; // "09:00"
        to: string; // "15:00"
    };
    phone1: string;
    phone2?: string;
    user_message?: string;
    admin_description?: string;

    createdAt?: Date;
}

export interface IBranchDocument extends Omit<IBranch, "_id">, Document {}

const branchShema = new Schema<IBranchDocument>(
    {
        title: { type: String, required: true },
        branchId: { type: String, required: true },
        adress: { type: String, required: true },
        city: { type: String, required: true },
        zip_code: { type: String, required: true },

        workTime: {
            from: { type: String, required: true },
            to: { type: String, required: true },
        },

        phone1: { type: String, required: true },
        phone2: { type: String, default: null },
        user_message: { type: String, default: null },
        admin_description: { type: String, default: null },

        createdAt: { type: Date, default: Date.now },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

export const BranchModel: Model<IBranchDocument> =
    models?.Branch || model<IBranchDocument>("Branch", branchShema);
