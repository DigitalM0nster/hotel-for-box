import { Schema, model, models, Types, Document, Model } from "mongoose";

export interface IAdress {
    _id?: string;
    userId: Types.ObjectId;
    country: string;
    adress: string;
    city: string;
    zip_code_eng?: string;
    //deliveryType: string; // например: "express", "pickup"
    deliveryMethod: "warehouse" | "courier"; // до склада или до двери
    isBusiness: boolean;

    // для физлица
    recipientName?: string;
    recipientSurname?: string;
    recipientPatronymic?: string;
    recipientInnNumber?: string;
    passportSeriesNumber?: string;
    passportIssuedBy?: string;
    passportIssuedDate?: string;
    recipientBirthDate?: string;
    recipientEmail?: string;

    // для бизнеса
    companyName?: string;

    phone1: string;
    phone2?: string;

    isDefault?: boolean;
    isConfirmed?: boolean;
    admin_description?: string;
    createdAt?: Date;
}

export interface IAdressDocument extends Omit<IAdress, "_id">, Document {}

//! ВСЯ ИНФА О ТОМ КТО ПОЛУЧАЕТ
const adressSchema = new Schema<IAdressDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ПОЛЬЗОВАТЕЛЬ КОТОРЫЙ ДОБАВИЛ ЭТОТ АДРЕСС

        country: { type: String, required: true }, // СТРАНА
        adress: { type: String, required: true },
        city: { type: String, required: true },
        zip_code_eng: { type: String, default: null },
        deliveryMethod: { type: String, enum: ["warehouse", "courier"], required: true }, //СПОСОБ ДОСТАВКИ
        isBusiness: { type: Boolean, required: true },
        phone1: { type: String, required: true },
        phone2: { type: String },

        // для физлица
        recipientName: { type: String, default: null },
        recipientSurname: { type: String, default: null },
        recipientPatronymic: { type: String, default: null },
        recipientInnNumber: { type: String, default: null }, //ИНН/ИИН/УНП получателя
        passportSeriesNumber: { type: String, default: null }, // СЕРЙИНИК ПАСПОРТА
        passportIssuedBy: { type: String, default: null }, //Кем выдан
        passportIssuedDate: { type: Date, default: null }, //Дата выдачи паспорта
        recipientBirthDate: { type: Date, default: null }, //Дата рождения получателя
        recipientEmail: { type: String, default: null }, //эл. почта (email)

        // для бизнеса
        companyName: { type: String, default: null },

        isDefault: { type: Boolean, default: false },

        isConfirmed: { type: Boolean, default: false },
        admin_description: { type: String, default: null },

        createdAt: { type: Date, default: Date.now },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

//Валидация: физлицо vs бизнес

// addressSchema.pre("save", function (next) {
//     if (this.isBusiness) {
//         if (!this.companyName) {
//             return next(new Error("Для бизнеса нужно указать companyName"));
//         }
//     } else {
//         if (
//             !this.recipientName ||
//             !this.recipientSurname ||
//             !this.recipientIdNumber ||
//             !this.passportSeriesNumber ||
//             !this.passportIssuedBy ||
//             !this.passportIssuedDate ||
//             !this.recipientBirthDate ||
//             !this.recipientEmail
//         ) {
//             return next(
//                 new Error("Для физлица нужно заполнить все паспортные и контактные данные")
//             );
//         }
//     }
//     next();
// });

export const AdressModel: Model<IAdressDocument> =
    models?.Adress || model<IAdressDocument>("Adress", adressSchema);
