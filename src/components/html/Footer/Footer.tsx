import Link from "next/link";

export default function Footer() {
    return (
        <footer
            className="flex flex-col-reverse gap-4 p-2
                                lg:flex-row lg:items-center
                                md:flex-col-reverse  md:justify-between
                                "
        >
            <Link href={"/"}>
                <img
                    src={"/logo.svg"}
                    alt="Hotel4Box logo"
                    className="
                    w-[124px] h-auto
                    sm:w-[144px] sm:h-auto
                    md:w-[180px] md:h-auto
                    xl:w-[213.12px] xl:h-auto
                    cursor-pointer
                    "
                />
            </Link>
            <div
                className="flex flex-col gap-4 
                                md:flex-row                                
                                "
            >
                <Link href={"/user"} className="link text-f-blue-950 cursor-pointer">
                    Помощь
                </Link>
                <Link href={"/user"} className="link text-f-blue-950 cursor-pointer">
                    Заявление о конфиденциальности
                </Link>
                <Link href={"/user"} className="link text-f-blue-950 cursor-pointer">
                    Отследить посылку
                </Link>
                <a className="link text-f-blue-950 cursor-pointer" href="#">
                    В начало страницы ↑
                </a>
            </div>
        </footer>
    );
}
