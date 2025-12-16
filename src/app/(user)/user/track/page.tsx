export default function TrackPage() {
    return (
        <div
            className="h-full flex flex-col max-w-[421px] gap-6
                        md:max-w-[495px]
                        lg:gap-10 lg:max-w-[630px]
                        "
        >
            <div
                className="flex flex-col border-b border-b-f-gray-200 pb-4 gap-6
                            lg:gap-8 lg:pb-8
                            "
            >
                <div className="h3 text-f-blue-950">Отследить посылку</div>
                <div className="body-3 text-f-blue-500">
                    Номер отслеживания — это уникальный идентификатор вашей посылки. Вы получите его
                    из интернет-магазина. Он не содержит дефисов, тире или других специальных
                    символов. Обычно он выглядит так: 940550699993860928093. Помимо цифр, номер
                    может содержать одну или несколько букв, например: TBA094490376000
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="body-3 text-f-blue-500">Введите ваш номер отслеживания</div>
                        <input className="bg-f-gray-50 rounded-lg py-3 px-4" />
                    </div>
                    <div className="cursor-pointer py-3 px-11 text-f-white-100 bg-f-accent self-start rounded-full">
                        Поиск заказа
                    </div>
                </div>

                <div className="box bg-f-gray-30 body-3 text-f-blue-950">
                    Не вводите в это поле номер заказа, который выглядит так: ORDER
                    #108-9223243-668032 (Amazon) или так: Item number 112122004715 (eBay)
                </div>
            </div>
        </div>
    );
}
