import Link from "next/link";
import LoginForm from "../../../components/forms/loginForm";
import { Suspense } from "react";

export default function LoginPage() {
    return (
        <div className="bg-f-gray-50 h-full flex justify-center items-center">
            <div
                className="box bg-f-white-100 flex flex-col gap-4 w-full 
                                    sm:max-w-[340px]
                                    lg:max-w-[364px]
                                    md:max-w-[340px]                                    
                                    xl:gap-6 xl:max-w-[608px]                                    
                                    "
            >
                <div className="flex flex-col gap-2">
                    <div className="h4 text-f-blue-950">Войти в личный кабинет</div>
                    <div className="flex gap-1">
                        <span className="body-3 text-f-blue-950">или</span>
                        <Link href={"/register"} className="body-3 text-f-accent cursor-pointer">
                            создать аккаунт
                        </Link>
                    </div>
                </div>
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
