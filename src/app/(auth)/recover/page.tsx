import { Input } from "@/components/ui/FormElements/Input";
import Link from "next/link";

export default function RegisterPage() {
    async function formAction(formData: FormData) {
        "use server";
        console.log("❤️", formData);
    }
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
                    <div className="h4 text-f-blue-950">Восстановить пароль</div>
                    <div className="flex gap-1">
                        <span className="body-3 text-f-blue-950">или</span>
                        <Link href={"/login"} className="body-3 text-f-accent">
                            авторизоваться
                        </Link>
                    </div>
                </div>
                <form
                    className=" flex flex-col gap-4 
                                    xl:gap-6
                                    "
                    action={formAction}
                >
                    <Input name="email" type="email" required placeholder="E-mail" />

                    <button
                        type="submit"
                        className="button-1 py-[11px] px-[70px] text-f-white-100 bg-f-accent self-start  rounded-full cursor-pointer 
                                    disabled:bg-f-blue-disabled"
                    >
                        Восстановить
                    </button>
                </form>
            </div>
        </div>
    );
}
