type PathParams = { path: string; title: string; dynamic: boolean };
type ProgectPathes = Record<string, PathParams>;

export const progectPathes = {
    home: { path: "/", title: "Главная страница", dynamic: false },
    login: { path: "/login", title: "Авторизация", dynamic: false },
    register: { path: "/register", title: "Регистрация", dynamic: false },
    recover: { path: "/recover", title: "Восстановление пароля", dynamic: false },
    user: { path: "/user", title: "Меню пользователя", dynamic: false },
    accounts: { path: "/user/accounts", title: "Счета", dynamic: false },
    branches: { path: "/user/branches", title: "Отделения", dynamic: false },
    branch: { path: "/user/branches/", title: "Отделене", dynamic: true },
    orders: { path: "/user/orders", title: "Мои заказы", dynamic: false },
    ordersId: { path: "/user/orders/", title: "Заказ", dynamic: true },
    profile: { path: "/user/profile", title: "Профиль пользователя", dynamic: false },
    address_book: { path: "/user/profile/address_book", title: "Адресная книга", dynamic: false },
    addressId: { path: "/user/profile/address_book/", title: "Адрес получателя", dynamic: true },
    change_password: {
        path: "/user/profile/change_password",
        title: "Смена пароля",
        dynamic: false,
    },
    payment_profile: {
        path: "/user/profile/payment_profile",
        title: "Платежный профиль",
        dynamic: false,
    },
    personal_information: {
        path: "/user/profile/personal_information",
        title: "Персональная информация",
        dynamic: false,
    },
    score_historys: {
        path: "/user/profile/score_historys",
        title: "История баллов",
        dynamic: false,
    },
    track: { path: "/user/track", title: "Отследить посылку", dynamic: false },
} as const;

export function getPageTitle(currentPath: string): PathParams {
    const pathes = progectPathes as ProgectPathes;
    const backPath = currentPath.split("/").slice(0, -1).join("/");
    for (const key in progectPathes) {
        if (pathes[key].path === backPath) return pathes[key];
    }

    return { path: "/", title: "Главная страница", dynamic: false };
}
