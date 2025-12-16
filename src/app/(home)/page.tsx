import Image from "next/image";
import styles from "./test.module.scss";

import Star from "@/assets/svg/star.svg";
import ArrowRight from "@/assets/svg/arrowRight.svg";
import Electronics from "@/assets/svg/electronics.svg";
import Shoes from "@/assets/svg/shoes.svg";
import ChildProds from "@/assets/svg/childProds.svg";
import SportProds from "@/assets/svg/sportProd.svg";
import OtherProds from "@/assets/svg/otherProds.svg";

import Box from "@/assets/png/box.png";
import Circle from "@/assets/png/circle.png";
import Profs from "@/assets/png/profs.png";
import Combo from "@/assets/png/combo.png";
import Comfort from "@/assets/png/comfort.png";
import Cashback from "@/assets/png/cashback.png";
import BoxHands from "@/assets/jpg/boxhands.jpg";
import Boxes from "@/assets/png/boxes2.png";
import Worker from "@/assets/png/worker.png";

import Comm1 from "@/assets/png/comm1.png";
import Comm2 from "@/assets/png/comm2.png";
import Comm3 from "@/assets/png/comm3.png";
import Comm4 from "@/assets/png/comm4.png";

//brands
import Amazon from "@/assets/png/brands/amazon.png";
import Apple from "@/assets/png/brands/apple.png";
import BB from "@/assets/png/brands/bb.png";
import MC from "@/assets/png/brands/mc.png";
import Ebay from "@/assets/png/brands/ebay.png";
import Costco from "@/assets/png/brands/costco.png";
import Target from "@/assets/png/brands/target.png";
import SC from "@/assets/png/brands/sc.png";
import { SealPercent } from "@/icons/icons";

export default function Home() {
    return (
        <div className="flex flex-col gap-[96px] md:gap-[140px] xl:gap-[180px]">
            <div className="firstBox  bg-f-gray-50 flex flex-col gap-12">
                <div className="flex justify-between ">
                    <div
                        className="flex flex-col gap-4
                                    lg:gap-6
                                    xl:gap-8
                                    "
                    >
                        <div className="flex flex-col">
                            <div className="h1 text-f-blue-950">Лучший способ получить </div>
                            <div className="h1 text-f-blue-950">международную </div>
                            <div className="h1 text-f-blue-950">посылку</div>
                        </div>
                        <div className="body-1 text-f-blue-500">
                            Покупайте в интернет-магазинах США
                            <br /> — мы доставим ваши заказы
                        </div>
                    </div>
                    <Image
                        src={Box}
                        width={672}
                        height={452}
                        alt="box"
                        priority
                        className="
                    hidden
                    sm:hidden
                    md:block md:w-[294px] md:h-[194px]
                    lg:block lg:w-[453.22px] lg:h-[320px]
                    xl:block xl:w-[672px] xl:h-[452px]
                "
                    />
                </div>
                <div
                    className="flex flex-col gap-4 
                                lg:flex-row lg:gap-6
                                "
                >
                    <div
                        className="box bg-f-white-100 flex flex-col gap-4 
                                    lg:gap-6
                                    xl:gap-8
                                    "
                    >
                        <div className="h3 text-f-blue-950">Рассчитать стоимость доставки</div>
                        <div
                            className="flex flex-col gap-2 items-center
                                        md:flex-row

                                        "
                        >
                            <div className="flex items-center gap-4 bg-f-gray-30 px-4 py-3.5 rounded-[12px] w-full">
                                <div className="h4-accent text-f-blue-950">Из</div>
                                <input className="h4 w-full" placeholder="Россия" />
                            </div>
                            <div
                                className="hidden
                                            md:block
                                            "
                            >
                                <ArrowRight />
                            </div>
                            <div className="flex items-center gap-4 bg-f-gray-30 px-4 py-3.5 rounded-[12px] w-full">
                                <div className="h4-accent text-f-blue-950">Из</div>
                                <input className="h4 w-full" placeholder="Россия" />
                            </div>
                        </div>
                        <div
                            className="button-1 text-center bg-f-accent text-f-white-100 py-2.5 px-8  rounded-full max-w-[240px]
                                        md:self-start 
                                        "
                        >
                            Получить расчёт
                        </div>
                    </div>
                    <div
                        className="box bg-f-white-100 flex flex-col gap-4 
                                    lg:gap-6
                                    xl:gap-8
                                    "
                    >
                        <div className="h3 text-f-blue-950">Отследить посылку</div>
                        <div className="flex items-center gap-4 bg-f-gray-30 px-4 py-3.5 rounded-[12px]">
                            <input className="h4" placeholder="Россия" />
                        </div>
                        <div
                            className="button-1 text-center bg-f-white-100 text-f-accent py-2.5 px-8  rounded-full border border-f-accent max-w-[240px]
                                   md:self-start 
                                    "
                        >
                            Отследить
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="flex flex-col gap-10
                            lg:gap-6
                            xl:gap-14
                            "
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="h2 text-f-blue-950">Как это работает?</div>
                    <div
                        className="body-1 text-f-blue-500 text-center w-59
                                    md:w-104
                                    xl:w-152
                                    "
                    >
                        Получив ваш заказ, мы убедимся в его целостности и пришлем вам счет за
                        доставку.
                    </div>
                </div>
                <div
                    className="grid grid-cols-1 gap-4
                            *:h-[304px] *:bg-f-gray-50
                            md:grid-cols-2 md:*:h-[321px]
                            lg:grid-cols-4 lg:*:h-[368px]
                            xl:*:h-[544px]
                            "
                >
                    <div className="box bg-white flex flex-col">
                        <div className="h-full flex">
                            <div
                                className="flex justify-center items-center bg-white rounded-full self-start w-16 h-16 p-5
                                            xl:w-[90px] xl:h-[90px]"
                            >
                                <Image
                                    src={"/svg/cursor-click.svg"}
                                    width={40}
                                    height={40}
                                    alt="step1"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                        <div className="h-full flex flex-col justify-between gap-8">
                            <div className="flex flex-col gap-5">
                                <div className=" bg-white self-start px-4 py-3 rounded-[12px]">
                                    <div className="tag text-f-blue-500">Шаг 1</div>
                                </div>

                                <div className="h4 text-f-blue-950">Выбор товаров</div>
                            </div>
                            <div className="body-1 text-f-blue-500">
                                Товары в любом интернет-магазине и отправьте их в одно из наших
                                отделений.
                            </div>
                        </div>
                    </div>
                    <div className="box bg-white flex flex-col">
                        <div className="h-full flex">
                            <div
                                className="flex justify-center items-center bg-white rounded-full self-start w-16 h-16 p-5
                                            xl:w-[90px] xl:h-[90px]"
                            >
                                <Image
                                    src={"/svg/receipt.svg"}
                                    width={40}
                                    height={40}
                                    alt="step2"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                        <div className="h-full flex flex-col justify-between gap-8">
                            <div className="flex flex-col gap-5">
                                <div className=" bg-white self-start px-4 py-3 rounded-[12px]">
                                    <div className="tag text-f-blue-500">Шаг 2</div>
                                </div>

                                <div className="h4 text-f-blue-950 text-nowrap">
                                    Поступление товара
                                </div>
                            </div>
                            <div className="body-1 text-f-blue-500">
                                После получения товара мы проверим его содержимое и вышлем вам счет
                                на доставку.
                            </div>
                        </div>
                    </div>
                    <div className="box bg-white flex flex-col">
                        <div className="h-full flex">
                            <div
                                className="flex justify-center items-center bg-white rounded-full self-start w-16 h-16 p-5
                                            xl:w-[90px] xl:h-[90px]"
                            >
                                <Image
                                    src={"/svg/credit-card.svg"}
                                    width={40}
                                    height={40}
                                    alt="step3"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                        <div className="h-full flex flex-col justify-between gap-8">
                            <div className="flex flex-col gap-5">
                                <div className=" bg-white self-start px-4 py-3 rounded-[12px]">
                                    <div className="tag text-f-blue-500">Шаг 3</div>
                                </div>

                                <div className="h4 text-f-blue-950">Оплата доставки</div>
                            </div>
                            <div className="body-1 text-f-blue-500">
                                Оплатите счет за доставку в вашем личном кабинете Hotel4box, и мы
                                отправим посылку
                            </div>
                        </div>
                    </div>
                    <div className="box bg-white flex flex-col">
                        <div className="h-full flex">
                            <div
                                className="flex justify-center items-center bg-white rounded-full self-start w-16 h-16 p-5
                                            xl:w-[90px] xl:h-[90px]"
                            >
                                <Image
                                    src={"/svg/package.svg"}
                                    width={40}
                                    height={40}
                                    alt="step4"
                                />
                            </div>
                        </div>
                        <div className="h-full flex flex-col justify-between gap-8">
                            <div className="flex flex-col gap-5">
                                <div className=" bg-white self-start px-4 py-3 rounded-[12px]">
                                    <div className="tag text-f-blue-500">Шаг 4</div>
                                </div>

                                <div className="h4 text-f-blue-950">Получение посылки</div>
                            </div>
                            <div className="body-1 text-f-blue-500">
                                Мы доставим посылку до двери клиента или в наш пункт выдачи.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="flex flex-col 
                gap-10 
                xl:gap-14
                md:gap-12
                sm:gap-10
                "
            >
                <div
                    className="h2 text-f-blue-950 text-center 
                                md:text-left
                                "
                >
                    Наши преимущества
                </div>
                <div
                    className="grid grid-cols-1 gap-4
                                xl:grid-cols-1 xl:gap-6
                                md:grid-cols-1 md:gap-4
                                sm:grid-cols-1 sm:gap-4
                "
                >
                    <div
                        className="
                        grid grid-cols-1 gap-4 
                        xl:grid-cols-2 xl:gap-6
                        lg:grid-cols-2 lg:gap-6
                        md:grid-cols-1 md:gap-4
                        sm:grid-cols-1 sm:gap-4   
                        *:min-h-[310px]                     
                    "
                    >
                        <div className="box bg-f-gray-50">
                            <div
                                className="flex flex-col-reverse gap-4 *:w-full 
                                            md:flex-row
                                            "
                            >
                                <div className="flex flex-col gap-3 self-end">
                                    <div className="h3 text-f-blue-950">Надежность</div>
                                    <div className="body-1 text-f-blue-500">
                                        Более 130 тыс. посылок успешно
                                        <br /> доставлены нашим клиентам.
                                    </div>
                                </div>
                                <div className="relative">
                                    <Image
                                        src={"/svg/circle.svg"}
                                        width={240}
                                        height={240}
                                        alt={"circle"}
                                        className="min-w-full"
                                    />
                                    <div className="flex flex-col gap-4  absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]">
                                        <div className="number-2 text-center text-f-blue-950">
                                            130K
                                        </div>
                                        <div className="body-2 text-center text-f-blue-500">
                                            Успешно доставленных посылок
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="box bg-f-gray-50 flex flex-col justify-between">
                            <div className="flex flex-col gap-2">
                                <Image
                                    src={Profs}
                                    width={224}
                                    height={80}
                                    alt="profs"
                                    className="w-40 h-14
                                                xl:w-56 xl:h-20
                                "
                                />
                                <div className="number-1 text-f-blue-950">10 000+</div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="h3 text-f-blue-950">Профессионализм</div>
                                <div
                                    className="body-1 text-f-blue-500 w-[220px]
                                                md:w-92
                                                "
                                >
                                    Hotel4Box работает уже более 6 лет и имеет более 10 тыс.
                                    постоянных клиентов.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="
                        grid grid-cols-1 gap-4 
                        xl:grid-cols-2 xl:gap-6
                        lg:grid-cols-2 lg:gap-6
                        md:grid-cols-1 md:gap-4
                        sm:grid-cols-1 sm:gap-4 
                        *:min-h-[310px]
                    "
                    >
                        <div
                            className="box bg-f-gray-50 flex flex-col justify-between relative overflow-hidden
                                        sm:h-[364px]
                                        md:h-[650px]
                                        lg:h-auto

                                        "
                        >
                            <div className="flex flex-col gap-3">
                                <div className="h3 text-f-blue-950">Комбинация заказов</div>
                                <div className="body-1 text-f-blue-500">
                                    Вы можете легко объединить несколько заказов в один и сэкономить
                                    на доставке. Вы также можете разделить заказ на несколько
                                    посылок.
                                </div>
                            </div>
                            <div
                                className=" absolute bottom-0 left-0 top-[20%]
                                            sm:top-[39%]
                                            md:top-[20%]
                                            "
                            >
                                <Image
                                    src={Combo}
                                    width={852}
                                    height={644}
                                    alt="combo"
                                    className="h-full w-auto"
                                />
                            </div>
                        </div>
                        <div
                            className="grid grid-cols-1 gap-4 
                            xl: xl:gap-6
                            md: md:gap-4
                            sm: sm:gap-4  
                            *:min-h-[310px] 
                            xl:*:min-h-[448px]                                               
                        "
                        >
                            <div className="box bg-f-gray-50 flex flex-col justify-between">
                                <div className="flex flex-col gap-3">
                                    <div className="h3 text-f-blue-950">Скорость</div>
                                    <div className="body-1 text-f-blue-500">
                                        Доставка в Монголию со склада
                                        <br /> в США составляет 5 рабочих дней.
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between ">
                                            <div className="h4 text-f-blue-950">США</div>
                                            <div
                                                className="w-6.5 h-6.5                                            
                                                            xl:w-10 xl:h-10
                                                            "
                                            >
                                                <Image
                                                    src={"/svg/airplane.svg"}
                                                    width={40}
                                                    height={40}
                                                    alt="airplane.svg"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <div className="h4 text-f-blue-950">Россия</div>
                                        </div>
                                        <input
                                            type="range"
                                            value={80}
                                            className="slider cursor-default"
                                            readOnly
                                        />
                                    </div>
                                    <div
                                        className="flex gap-2.5 items-center
                                                    xl:gap-4
                                    "
                                    >
                                        <div className="number-1 text-f-blue-950">от 10</div>
                                        <div className="body-3 text-f-blue-500 w-15">
                                            рабочих дней
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="box bg-f-gray-50 relative overflow-hidden ">
                                <div className="flex flex-col gap-3 ">
                                    <div className="h3 text-f-blue-950">Комфорт</div>
                                    <div className="body-1 text-f-blue-500">
                                        Мы позаботимся об упаковке,
                                        <br /> таможенном оформлении и доставке.
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0  top-[25%]  flex min-w-[370px]">
                                    <Image
                                        src={Comfort}
                                        width={648}
                                        height={323}
                                        alt="comfort"
                                        className=" w-auto h-auto object-right "
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="
                        grid grid-cols-1 gap-4 
                        xl:grid-cols-2 xl:gap-6
                        lg:grid-cols-2 lg:gap-6
                        md:grid-cols-1 md:gap-4
                        sm:grid-cols-1 sm:gap-4    
                        *:min-h-[310px]                     
                    "
                    >
                        <div className="box bg-f-accent flex flex-col gap-10.5">
                            {/* <Image src={Cashback} width={86} height={56} alt="cashback" /> */}
                            <div className="flex">
                                <div className="bg-f-white-100 w-20 h-20 rounded-full flex items-center justify-center border-2 border-f-accent z-10">
                                    <SealPercent />
                                </div>
                                <div className="bg-f-white-100 w-20 h-20 rounded-full flex items-center justify-center border-2 border-f-accent overflow-hidden -translate-x-1/2">
                                    <Image src={Worker} alt="worker" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="h4 text-f-white-100">Кэшбек</div>
                                <div className="body-1 text-f-white-100">
                                    Вы получаете 1 балл за каждые $100, потраченные на доставку. Вы
                                    можете оплатить часть стоимости доставки, используя накопленные
                                    баллы.
                                </div>
                            </div>
                            <div className="button-1 text-f-accent bg-f-white-100 self-start py-4.5 px-8 rounded-full">
                                Подробнее о кэшбеке
                            </div>
                        </div>
                        <div className="box bg-transparent relative overflow-hidden h-auto ">
                            <div className="absolute left-0 right-0 bottom-0 top-0">
                                <Image
                                    src={BoxHands}
                                    width={852}
                                    height={120}
                                    alt="BoxHands"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div
                    className="flex flex-col gap-6
                                xl:gap-14
                                md:gap-y-12
                                sm:gap-3
                                "
                >
                    <div className="flex flex-col gap-6 self-center">
                        <div className="h2 text-f-blue-950 text-center">
                            Самые популярные магазины
                        </div>
                        <div className="body-1 text-center text-[#56688E]">
                            Покупайте в этих и любых других магазинах США – мы <br />
                            позаботимся о доставке
                        </div>
                    </div>

                    <div
                        className="bg-f-white-100 flex  rounded-2xl p-2 gap-2 self-center flex-nowrap scroll-smooth scrollbar-hide z-10
                                    lg:bg-gray-50 lg:w-auto
                                    md:bg-transparent md:flex-wrap md:justify-center
                                    sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:whitespace-nowrap sm:w-full 
                                    "
                    >
                        <div
                            className="bg-f-gray-50 flex align-middle gap-2 rounded-xl p-3 
                                        md:bg-f-gray-30 
                                        lg:bg-f-white-100
                                        "
                        >
                            <div>
                                <Electronics className="**:fill-f-accent" />
                            </div>
                            <div className="h5 text-f-accent self-center">Электроника</div>
                        </div>

                        <div
                            className="bg-transparent flex align-middle gap-2 rounded-xl p-3
                                        md:bg-f-white-100 
                                        lg:bg-transparent
                                        "
                        >
                            <div>
                                <Shoes className="**:fill-f-blue-500" />
                            </div>
                            <div className="h5 text-f-blue-500 self-center">Одежда и обувь</div>
                        </div>

                        <div
                            className="bg-transparent flex align-middle gap-2 rounded-xl p-3
                                        md:bg-f-white-100 
                                        lg:bg-transparent
                                        "
                        >
                            <div>
                                <ChildProds className="**:fill-f-blue-500" />
                            </div>
                            <div className="h5 text-f-blue-500 self-center">Детские товары</div>
                        </div>

                        <div
                            className="bg-transparent flex align-middle gap-2 rounded-xl p-3
                                        md:bg-f-white-100 
                                        lg:bg-transparent
                                        "
                        >
                            <div>
                                <SportProds className="**:fill-f-blue-500" />
                            </div>
                            <div className="h5 text-f-blue-500 self-center">
                                Спорт и активный отдых
                            </div>
                        </div>

                        <div
                            className="bg-transparent flex align-middle gap-2 rounded-xl p-3
                                        md:bg-f-white-100 
                                        lg:bg-transparent
                                        "
                        >
                            <div>
                                <OtherProds className="**:fill-f-blue-500" />
                            </div>
                            <div className="h5 text-f-blue-500 self-center">И многое другое</div>
                        </div>
                    </div>
                </div>
                <div
                    className="grid grid-cols-2 gap-2
                                xl:grid-cols-4 xl:gap-6
                                md:grid-cols-4 md:gap-4
                                sm:grid-cols-2 sm:gap-2
                                *:min-h-20
                                *:bg-gray-100
                                "
                >
                    <div className="box">
                        <Image src={Amazon} width={354} height={173} alt="amazon" />
                    </div>
                    <div className="box">
                        <Image src={Apple} width={354} height={173} alt="amazon" />
                    </div>
                    <div className="box">
                        <Image src={BB} width={354} height={173} alt="amazon" />
                    </div>
                    <div className="box">
                        <Image src={MC} width={354} height={173} alt="amazon" />
                    </div>
                    <div className="box">
                        <Image src={Ebay} width={354} height={173} alt="amazon" />
                    </div>
                    <div className="box">
                        <Image src={Costco} width={354} height={173} alt="amazon" />
                    </div>
                    <div className="box">
                        <Image src={Target} width={354} height={173} alt="amazon" />
                    </div>
                    <div className="box">
                        <Image src={SC} width={354} height={173} alt="amazon" />
                    </div>
                </div>
            </div>
            <div
                className="flex flex-col gap-6
                            xl:gap-14
                            md:gap-12
                            sm:gap-10
                            "
            >
                <div className="h2 text-f-blue-950">Отзывы</div>
                <div
                    className="grid grid-cols-1
                                 *:bg-f-gray-50
                                 xl:grid-cols-2 xl:gap-6
                                 lg:grid-cols-2 lg:gap-4
                                 md:grid-cols-2 md:gap-4
                                 sm:grid-cols-1 sm:gap-4
                                "
                >
                    <div
                        className="box flex flex-col gap-6
                                    md:gap-10
                                    "
                    >
                        <div
                            className="flex flex-col gap-4
                                        lg:flex-row md:justify-between
                                        "
                        >
                            <div className="flex gap-3">
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                            </div>
                            <Image
                                src={Comm1}
                                width={280}
                                height={136}
                                alt="com1"
                                className="w-46.5
                                           md:w-70 md:self-end
                                            "
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h3 text-f-blue-950">Отзыв</div>
                            <div className="body-2 text-f-gray-500 max-w-110">
                                Какое удовольствие получать эти коробки! И конечно же вы знаете, что
                                внутри, но вы все равно открываете их как рождественский подарок.
                                Доставили быстро. И хорошо упаковано. Спасибо, hotel4box!
                            </div>
                        </div>
                    </div>
                    <div
                        className="box flex flex-col gap-6
                                    md:gap-10
                                    "
                    >
                        <div
                            className="flex flex-col gap-4
                                        lg:flex-row md:justify-between
                                        "
                        >
                            <div className="flex gap-3">
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-gray-200" />
                            </div>
                            <Image
                                src={Comm2}
                                width={280}
                                height={136}
                                alt="com2"
                                className="w-46.5
                                           md:w-70 md:self-end
                                            "
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h3 text-f-blue-950">Отзыв</div>
                            <div className="body-2 text-f-gray-500 max-w-110">
                                Отличный сервис! Доставили все супербыстро и грамотно! ☺️Курьер
                                доставил посылку прямо ко мне домой, даже идти никуда не пришлось.
                            </div>
                        </div>
                    </div>
                    <div
                        className="box flex flex-col gap-6
                                    md:gap-10
                                    "
                    >
                        <div
                            className="flex flex-col gap-4
                                        lg:flex-row md:justify-between
                                        "
                        >
                            <div className="flex gap-3">
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-gray-200" />
                            </div>
                            <Image
                                src={Comm3}
                                width={280}
                                height={136}
                                alt="com3"
                                className="w-46.5
                                           md:w-70 md:self-end
                                            "
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h3 text-f-blue-950">Отзыв</div>
                            <div className="body-2 text-f-gray-500 max-w-110">
                                Наконец-то доставили очередную посылку из США. Все как всегда быстро
                                и надежно: сама организация (всегда доступен онлайн-чат, где за
                                несколько секунд отвечают на все мои вопросы, помогают и дают
                                советы), быстрая доставка (12-20 дней до Перта), качественная
                                упаковка, удобный личный кабинет.
                            </div>
                        </div>
                    </div>
                    <div
                        className="box flex flex-col gap-6
                                    md:gap-10
                                    "
                    >
                        <div
                            className="flex flex-col gap-4
                                        lg:flex-row md:justify-between
                                        "
                        >
                            <div className="flex gap-3">
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                                <Star className="*:fill-f-accent" />
                            </div>
                            <Image
                                src={Comm4}
                                width={280}
                                height={136}
                                alt="com1"
                                className="w-46.5
                                           md:w-70 md:self-end
                                            "
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h3 text-f-blue-950">Отзыв</div>
                            <div className="body-2 text-f-gray-500 max-w-110">
                                Какое удовольствие получать эти коробки! И конечно же вы знаете, что
                                внутри, но вы все равно открываете их как рождественский подарок.
                                Доставили быстро. И хорошо упаковано. Спасибо, hotel4box!
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="boxNoPadding flex flex-col gap-8 *:w-full bg-f-gray-50 
                            xl:flex-row
                            lg:flex-row
                            md:flex-col
                            sm:flex-col                            
                            "
            >
                <div className="box flex flex-col gap-4 flex-1/2">
                    <div className="h2 text-f-blue-950">
                        Регистрируйтесь, получите персональный адрес в США и начинайте шопинг!
                    </div>
                    <div className="body-1 text-f-blue-950">
                        Мы доставляем товары из-за границы прямо к вам домой
                    </div>
                    <div
                        className="button-1 text-center text-f-white-100 bg-f-accent py-2.5 px-6 rounded-full self-start
                                    sm:w-full
                                    md:w-auto
                                    "
                    >
                        Получить торговый адрес
                    </div>
                </div>
                <div className=" flex-1/2 ">
                    <Image
                        src={Boxes}
                        alt="boxes"
                        width={688}
                        height={370}
                        className=" w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
}
