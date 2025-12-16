import { Input } from "@/components/ui/FormElements/Input";

export default function ChangePasswordPage() {
    return (
        <div className="w-full h-full py-8 max-w-[413px] flex flex-col gap-4 xl:gap-6">
            <div className="h3">Смена пароля</div>
            <form className="flex flex-col gap-4 xl:gap-6">
                <Input name="password_old" title="Старый пароль" hideEye />
                <Input name="password" title="Новый пароль" hideEye />
                <button className="button-1 border-1 border-f-accent p-[11px] px-6 rounded-full text-center cursor-pointer text-f-white-100 bg-f-accent self-start">
                    Сохранить
                </button>
            </form>
        </div>
    );
}
