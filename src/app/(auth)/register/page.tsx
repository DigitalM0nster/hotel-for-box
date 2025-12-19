import Link from "next/link";
import { auth } from "@/auth";
import RegisterForm from "../../../components/forms/singUpForm";

// Страница регистрации.
// Если сюда заходит админ/суперадмин из админки,
// он сможет при создании пользователя выбрать роль/подтверждение.
export default async function RegisterPage() {
	const session = await auth();
	const currentAdminRole = session?.user.role ?? "user";

	return (
		<div className="registerPageWrapper">
			<div className="registerPageBox">
				<div className="registerPageHeader">
					<div className="registerPageTitle">Создать аккаунт</div>
					<div className="registerPageSubTitleRow">
						<span className="registerPageSubTitleText">или</span>
						<Link href={"/login"} className="registerPageLoginLink">
							авторизоваться
						</Link>
					</div>
				</div>

				<RegisterForm currentAdminRole={currentAdminRole} />
			</div>
		</div>
	);
}
