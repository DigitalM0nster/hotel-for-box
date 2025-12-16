"use client";
import { addCardToUser } from "@/libs/services/stripeService";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function AddCardFormWrapper() {
    return (
        <Elements stripe={stripePromise}>
            <AddCardForm />
        </Elements>
    );
}

//TODO Уведомления через toast и стилизация карты и формы
function AddCardForm() {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        setLoading(true);
        setMessage(null);

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
        });

        if (error || !paymentMethod) {
            setMessage(error?.message ?? "Ошибка при создании карты");
            setLoading(false);
            return;
        }

        try {
            const res = await addCardToUser(paymentMethod.id);
            setMessage(res.success ? "Карта успешно добавлена" : "Ошибка при сохранении");
        } catch (err: any) {
            setMessage(err?.message ?? "Не удалось сохранить карту");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md space-y-4 ">
            <CardElement
                options={{
                    hidePostalCode: true,
                    disableLink: true,
                    style: {
                        base: {
                            fontSize: "16px",
                            color: "#1a1a1a",
                            fontFamily: "Inter, sans-serif",
                            "::placeholder": {
                                color: "#a0a0a0",
                            },
                            padding: "12px",
                        },
                        invalid: {
                            color: "#e5424d",
                        },
                        complete: {
                            color: "#2ecc71",
                        },
                    },
                }}
            />

            <button
                type="submit"
                className="button-2 btn bg-f-accent text-f-white-100"
                disabled={!stripe || loading}
            >
                {loading ? "Добавление..." : "Привязать карту"}
            </button>

            {message && <p className="text-sm text-red-500">{message}</p>}
        </form>
    );
}
