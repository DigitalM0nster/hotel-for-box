"use client";

import { deleteCard, getSavedCard } from "@/libs/services/stripeService";
import { useEffect, useState, useTransition } from "react";
import Stripe from "stripe";

export default function UserCard() {
    const [paymentMethod, setPaymentMethod] =
        useState<Stripe.Response<Stripe.PaymentMethod> | null>(null);
    const [loading, startTransition] = useTransition();

    useEffect(() => {
        startTransition(() => {
            getSavedCard().then((data) => setPaymentMethod(data));
        });
    }, []);

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const delRes = await deleteCard(id);
            if (delRes) setPaymentMethod(null);
        });
    };

    if (!paymentMethod || !paymentMethod.card) {
        return <p className="text-sm text-gray-500">Нет привязанных карт.</p>;
    }

    return (
        <div className="space-y-4 self-start">
            <div
                key={paymentMethod.id}
                className="border p-4 rounded-lg flex items-center justify-between"
            >
                <div>
                    <p className="text-md font-medium capitalize">{paymentMethod.card.brand}</p>
                    <p className="text-sm text-gray-600">
                        **** **** **** {paymentMethod.card.last4}
                    </p>
                    <p className="text-xs text-gray-500">
                        Срок: {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                    </p>
                </div>

                <button disabled={loading} onClick={() => handleDelete(paymentMethod.id)}>
                    Удалить
                </button>
            </div>
        </div>
    );
}
