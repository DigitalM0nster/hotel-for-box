import { auth } from "@/auth";
import CircleProgress from "@/components/ui/CircleProgress/CircleProgress";

interface IUserInfoProps {
    // name: string;
    // userName: string;
    // balance: number;
    // status: number;
    className?: string;
}

export default async function UserInfo(props: IUserInfoProps) {
    const { className = "" } = props;
    const session = await auth();
    const { user } = session!;
    return (
        <div className={`flex flex-col ${className}`}>
            <CircleProgress value={23} strokeWidth={15} className="pb-4" />
            <div className="h5-accent text-f-blue-950 mb-2">
                Привет, {`${user.name} ${user.surname}`}
            </div>
            <div className="flex gap-1 mb-2">
                <div className="body-2 text-f-blue-500">Пользователь:</div>
                <div className="body-2 text-f-blue-950">{user.email}</div>
            </div>
            <div className="flex gap-1 mb-2">
                <div className="body-2 text-f-blue-500">Баланс:</div>
                <div className="body-2 text-f-blue-950">${Number(0).toFixed(2)}</div>
            </div>
        </div>
    );
}
