# Анализ раздела "Отчёты" и план реализации

## Структура раздела "Отчёты"

Раздел "Отчёты" будет содержать следующие подразделы:
1. **Рейсы** (Flights)
2. **Управление багажом** (Bag Management)
3. **Самообслуживание** (Self-service)
4. **Доставка** (Delivery)
5. **Отчёты / Самовывоз** (Reports / Walkin)
6. **История полок** (Shelf History)
7. **Сводка** (Summary)
8. **Заблокированные пользователи** (Blocked Users)

---

## 1. РЕЙСЫ (Flights)

### Что это:
Рейс — это логистическая отправка, объединяющая несколько мешков (багажа) для транспортировки между странами/складами.

### Что нужно создать:

#### Модель Flight (`src/mongodb/models/flightModel.ts`):
```typescript
interface IFlight {
  _id?: string;
  code: string; // "DE-UBN-20251218express"
  fromCountry: string; // "США" или "Монголия"
  toCountry: string; // "Монголия" или "Россия"
  fromBranchId?: ObjectId; // Склад отправления
  toBranchId?: ObjectId; // Склад назначения
  plannedDepartureAt?: Date;
  plannedArrivalAt?: Date;
  actualDepartureAt?: Date;
  actualArrivalAt?: Date;
  status: "Planned" | "In transit" | "Arrived" | "Closed";
  bagsCount: number; // Вычисляемое: количество привязанных мешков
  totalWeightKg: number; // Вычисляемое: суммарный вес всех мешков
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### Модель Bag (`src/mongodb/models/bagModel.ts`):
```typescript
interface IBag {
  _id?: string;
  name: string; // "Exp-Dec182025-4040"
  weightKg: number; // Общий вес мешка
  flightId?: ObjectId | null; // К какому рейсу привязан
  orderIds: string[]; // Список orderId заказов в мешке
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Откуда брать данные:
- **Список рейсов**: из модели Flight
- **Мешки в рейсе**: BagModel.find({ flightId })
- **Заказы в мешке**: OrderModel.find({ orderId: { $in: bag.orderIds } })
- **Вес и количество**: агрегация из заказов

### Что уже есть:
- ✅ `OrderModel.bagId` — поле для связи заказа с мешком

### Что нужно добавить:
- ❌ Модель Flight
- ❌ Модель Bag
- ❌ API endpoints для управления рейсами и мешками
- ❌ Компоненты для отображения списка рейсов, управления мешками

---

## 2. УПРАВЛЕНИЕ БАГАЖОМ (Bag Management)

### Что это:
Детальный список багажа (мешков) с информацией о заказах внутри каждого мешка.

### Откуда брать данные:
- **Трек-номер**: `OrderModel.track`
- **Вес**: `OrderModel.weight`
- **Получатель**: `OrderModel.adressSnapshot.recipientName`, `recipientSurname`
- **Адрес получателя**: `OrderModel.adressSnapshot.adress`, `city`, `country`
- **Телефон получателя**: `OrderModel.adressSnapshot.phone1`
- **Номер сумки**: `BagModel.name` (через `OrderModel.bagId`)
- **Абонентский ящик**: `OrderModel.h4b_us_id`

### Что уже есть:
- ✅ Все необходимые поля в OrderModel
- ✅ `OrderModel.bagId` для связи с мешком

### Что нужно добавить:
- ❌ Компонент для отображения списка багажа по рейсу
- ❌ API endpoint для получения списка багажа

---

## 3. САМООБСЛУЖИВАНИЕ (Self-service)

### Что это:
Функционал для клиентов, которые самостоятельно забирают посылки со склада.

### Откуда брать данные:
- **Полка/ячейка**: `OrderModel.shelf`
- **Абонентский ящик**: `OrderModel.h4b_us_id`
- **Пользователь**: `OrderModel.userId` → `UserModel`
- **Статус заказа**: `OrderModel.status`

### Что уже есть:
- ✅ `OrderModel.shelf` — полка на складе
- ✅ `OrderModel.h4b_us_id` — абонентский ящик
- ✅ `OrderModel.status` — статус заказа

### Что нужно добавить:
- ❌ Компонент для отображения заказов на самообслуживании
- ❌ API endpoint для фильтрации заказов по shelf/h4b_us_id

---

## 4. ДОСТАВКА (Delivery)

### Что это:
Отчёт по доставкам с информацией об отправителях, получателях, адресах, весе, оплате.

### Откуда брать данные:
- **Категории товаров**: `OrderModel.products[].category` (агрегация)
- **Отправитель**: `OrderModel.shopUrl`
- **Адрес отправителя**: можно брать из `BranchModel` (originBranchId) или хранить отдельно
- **Получатель**: `OrderModel.userSnapshot.name`, `surname`
- **Адрес получателя**: `OrderModel.adressSnapshot.adress`, `city`, `country`
- **Телефон получателя**: `OrderModel.adressSnapshot.phone1`
- **Почтовый ящик**: `OrderModel.h4b_us_id`
- **Стоимость доставки**: `OrderModel.order_coast`
- **Оплачено**: `OrderModel.paid > 0`
- **Дата оплаты**: `OrderModel.paymentInfo.paidAt`
- **Вес**: `OrderModel.weight`

### Что уже есть:
- ✅ Все необходимые поля в OrderModel
- ✅ `OrderModel.adressSnapshot` — снимок адреса
- ✅ `OrderModel.userSnapshot` — снимок пользователя
- ✅ `OrderModel.paymentInfo` — информация об оплате

### Что нужно добавить:
- ❌ Компонент для отображения отчёта по доставке
- ❌ API endpoint для получения данных с фильтрацией

---

## 5. ОТЧЁТЫ / САМОВЫВОЗ (Reports / Walkin)

### Что это:
"Walkin" = "Самовывоз" — когда клиент приходит на склад и забирает посылку сам, без доставки курьером.

### Откуда брать данные:
- **Способ доставки**: `OrderModel.adressSnapshot.deliveryMethod === "warehouse"`
- **Полка**: `OrderModel.shelf`
- **Абонентский ящик**: `OrderModel.h4b_us_id`
- **Статус**: `OrderModel.status`

### Что уже есть:
- ✅ `OrderModel.adressSnapshot.deliveryMethod` — способ доставки
- ✅ `OrderModel.shelf` — полка
- ✅ `OrderModel.h4b_us_id` — абонентский ящик

### Что нужно добавить:
- ❌ Компонент для отображения заказов на самовывоз
- ❌ API endpoint для фильтрации по deliveryMethod === "warehouse"

---

## 6. ИСТОРИЯ ПОЛОК (Shelf History)

### Что это:
История изменений полок для заказов — когда заказ был перемещён на другую полку, кто это сделал, когда.

### Откуда брать данные:
- **История изменений**: `OrderModel.history[]`
- **Текущая полка**: `OrderModel.shelf`
- **Пользователь, который изменил**: `OrderModel.history[].userName`
- **Дата изменения**: `OrderModel.history[].createdAt`

### Что уже есть:
- ✅ `OrderModel.history` — массив истории изменений
- ✅ `OrderModel.history[].shelf` — полка в истории
- ✅ `OrderModel.history[].userName` — кто изменил
- ✅ `OrderModel.history[].createdAt` — когда изменили

### Что нужно добавить:
- ❌ Компонент для отображения истории полок
- ❌ API endpoint для получения истории с фильтрацией по shelf

---

## 7. СВОДКА (Summary)

### Что это:
Агрегированные данные по всем заказам: общее количество, сумма, вес, статистика по статусам.

### Откуда брать данные:
- **Общее количество заказов**: `OrderModel.countDocuments()`
- **Общая сумма**: `OrderModel.aggregate([{ $sum: "$products_total_cost" }])`
- **Общий вес**: `OrderModel.aggregate([{ $sum: "$weight" }])`
- **Статистика по статусам**: группировка по `OrderModel.status`
- **Статистика по складам**: группировка по `OrderModel.originBranchId`

### Что уже есть:
- ✅ Все необходимые поля для агрегации

### Что нужно добавить:
- ❌ Компонент для отображения сводки
- ❌ API endpoint для получения агрегированных данных

---

## 8. ЗАБЛОКИРОВАННЫЕ ПОЛЬЗОВАТЕЛИ (Blocked Users)

### Что это:
Список пользователей, которые заблокированы администратором.

### Откуда брать данные:
- **Заблокированные пользователи**: `UserModel.find({ is_blocked: true })`
- **Информация о пользователе**: `UserModel.name`, `surname`, `email`, `phone1`
- **Дата блокировки**: можно добавить поле `blockedAt` или использовать `updatedAt`

### Что уже есть:
- ✅ `UserModel.is_blocked` — флаг блокировки

### Что нужно добавить:
- ❌ Компонент для отображения заблокированных пользователей
- ❌ API endpoint для получения списка (можно использовать существующий `/api/users`)

---

## ПЛАН РЕАЛИЗАЦИИ

### Этап 1: Базовые модели (если нужны)
1. Создать модель `FlightModel`
2. Создать модель `BagModel`
3. Обновить связи в `OrderModel` (уже есть `bagId`)

### Этап 2: Простые отчёты (без моделей Flight/Bag)
1. ✅ **Сводка** — можно сделать сразу (агрегация из OrderModel)
2. ✅ **Заблокированные пользователи** — можно сделать сразу (фильтр по is_blocked)
3. ✅ **Доставка** — можно сделать сразу (данные из OrderModel)
4. ✅ **Самообслуживание** — можно сделать сразу (фильтр по deliveryMethod и shelf)
5. ✅ **История полок** — можно сделать сразу (данные из OrderModel.history)

### Этап 3: Отчёты, требующие модели Flight/Bag
1. **Рейсы** — нужны модели Flight и Bag
2. **Управление багажом** — нужна модель Bag
3. **Отчёты / Самовывоз** — можно сделать без моделей (фильтр по deliveryMethod)

---

## ВЫВОДЫ

### Что хватает:
- ✅ Все данные для отчётов "Доставка", "Самообслуживание", "История полок", "Сводка", "Заблокированные пользователи"
- ✅ Поле `bagId` в OrderModel для будущей связи с мешками
- ✅ Поле `shelf` для истории полок
- ✅ Поле `h4b_us_id` для абонентских ящиков
- ✅ Поле `is_blocked` для заблокированных пользователей

### Что нужно добавить:
- ❌ Модели Flight и Bag (для разделов "Рейсы" и "Управление багажом")
- ❌ API endpoints для всех отчётов
- ❌ Компоненты для отображения отчётов

### Рекомендация:
Начать с реализации простых отчётов (Сводка, Заблокированные пользователи, Доставка, Самообслуживание, История полок), которые не требуют новых моделей. Затем добавить модели Flight и Bag для разделов "Рейсы" и "Управление багажом".
