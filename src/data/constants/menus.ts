import { IUserMenuItem, IUserProfileMenuItem } from "../../types/types";
import Order from "@/assets/svg/order.svg";
import Accounts from "@/assets/svg/accounts.svg";
import Branches from "@/assets/svg/branches.svg";
import Track from "@/assets/svg/track.svg";
import Profile from "@/assets/svg/profile.svg";

export const USER_ASIDE_MENU_ITEMS: Array<IUserMenuItem> = [
	{
		name: "orders",
		title: "Мои заказы",
		Ico: Order,
	},
	{
		name: "accounts",
		title: "Счета",
		Ico: Accounts,
	},
	{
		name: "branches",
		title: "Отделения",
		Ico: Branches,
	},
	{
		name: "track",
		title: "Отследить посылку",
		Ico: Track,
	},
	{
		name: "profile",
		title: "Мой профиль ",
		Ico: Profile,
	},
];

export const USER_FOOTER_MENU_ITEMS: Array<IUserMenuItem> = [
	{
		name: "orders",
		title: "Мои заказы",
		Ico: Order,
	},
	{
		name: "accounts",
		title: "Счета",
		Ico: Accounts,
	},
	{
		name: "branches",
		title: "Отделения",
		Ico: Branches,
	},
	{
		name: "track",
		title: "Отследить",
		Ico: Track,
	},
];

export const USER_PROFILE_MENU: Array<IUserProfileMenuItem> = [
	{
		title: "Персональная информация",
		name: "",
	},
	{
		title: "Адресная книга",
		name: "address_book",
	},
	{
		title: "Платежный профиль",
		name: "payment_profile",
	},
	{
		title: "История баллов",
		name: "score_historys",
	},
];
