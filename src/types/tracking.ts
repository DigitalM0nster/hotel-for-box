// types/tracking.ts

// Статусы — привёл набор распространённых статусов.
// Можно расширять при необходимости.
export type TrackingStatus =
    | "unknown"
    | "info_received"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed_attempt"
    | "exception"
    | "expired"
    | "available_for_pickup"
    | "return_to_sender";

// Категория статуса — обычно "in_progress", "completed", "error", "pending"
export type StatusCategory = "pending" | "in_progress" | "completed" | "exception" | "unknown";

// Дополнительная структурированная информация о статусе
export interface StatusInfo {
    status: TrackingStatus; // normalized status
    sub_status?: string | null; // более детальный подстатус (текст)
    status_text?: string | null; // человекопонятный текст
    sub_status_text?: string | null; // человекопонятный текст для sub_status
    status_code?: number | null; // численный код (если есть)
    sub_status_code?: number | null; // численный код подстатуса
    status_category?: StatusCategory | string | null;
}

// Описание одного события (истории)
export interface TrackingEvent {
    id?: string; // иногда есть уникальный id события
    time: string; // ISO-строка, либо "YYYY-MM-DD HH:mm:ss"
    location?: string | null; // общая локация "City, Region, Country"
    country_code?: string | null; // ISO-2 код страны, если есть
    city?: string | null;
    status?: string | null; // оригинальный текст статуса от курьера
    description?: string | null; // детальное описание события
    raw?: Record<string, any> | null; // сырые данные, если нужно сохранить
}

// Основной объект трекинга
export interface TrackingItem {
    id?: string | null;
    tracking_number: string;
    courier_code?: string | null; // код курьера в TrackingMore
    created_at?: string | null;
    updated_at?: string | null;
    order_id?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    note?: string | null;
    origin_country?: string | null; // ISO-2
    destination_country?: string | null; // ISO-2
    shipment_package_count?: number | null;
    status: TrackingStatus | string; // иногда приходит произвольная строка
    status_info?: StatusInfo | null;
    last_event?: string | null;
    last_update_at?: string | null;
    events?: TrackingEvent[] | null;
    raw?: Record<string, any> | null; // если нужно хранить полностью ответ
}

// Обёртка ответа TrackingMore (типичная форма)
export interface TrackingMoreResponse {
    code: number;
    message?: string | null;
    data?: {
        items: TrackingItem[];
        // иногда возвращают дополнительные поля (pagination и т.д.)
        [k: string]: any;
    } | null;
    [k: string]: any;
}
