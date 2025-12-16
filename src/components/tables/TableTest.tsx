"use client";

// Импорт React-хука useState
import { useState } from "react";

// Импорт ядра TanStack Table
import {
    ColumnDef, // Тип для описания колонок
    flexRender, // Функция для рендера ячеек и заголовков
    getCoreRowModel, // Основная модель строк
    getPaginationRowModel, // Модель для пагинации
    getSortedRowModel, // Модель для сортировки
    SortingState, // Тип состояния сортировки
    useReactTable, // Хук и главное API таблицы
} from "@tanstack/react-table";

// --------------------
// Типизация данных
// --------------------
type User = {
    id: number;
    name: string;
    email: string;
};

// --------------------
// Тестовые данные
// --------------------
const data: User[] = [
    { id: 1, name: "John Doe", email: "john@mail.com" },
    { id: 2, name: "Jane Fast", email: "jane@mail.com" },
    { id: 3, name: "Leo Bright", email: "leo@mail.com" },
    { id: 4, name: "Nora Sharp", email: "nora@mail.com" },
    { id: 5, name: "Alice Blue", email: "alice@mail.com" },
    { id: 6, name: "Bob Green", email: "bob@mail.com" },
];

// --------------------
// Описание колонок таблицы
// --------------------
const columns: ColumnDef<User>[] = [
    {
        // accessorKey — ключ поля объекта
        accessorKey: "id",
        // Заголовок столбца
        header: "ID",
    },
    {
        accessorKey: "name",
        header: "Имя",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
];

// --------------------
// Компонент таблицы
// --------------------
export default function UsersTable() {
    // Состояние сортировки
    const [sorting, setSorting] = useState<SortingState>([]);

    // Количество строк на странице
    const [pageSize] = useState(5);

    // Создание таблицы через useReactTable
    const table = useReactTable({
        data, // данные таблицы
        columns, // описание колонок

        // Текущее состояние таблицы
        state: {
            sorting, // текущее состояние сортировки
        },

        // Callback, который вызывается при изменении сортировки
        onSortingChange: setSorting,

        // Базовая модель строк
        getCoreRowModel: getCoreRowModel(),

        // Модель для сортировки строк
        getSortedRowModel: getSortedRowModel(),

        // Модель для пагинации (разбиения страниц)
        getPaginationRowModel: getPaginationRowModel(),

        // Начальное состояние таблицы
        initialState: {
            pagination: {
                pageIndex: 0, // начальная страница
                pageSize, // количество строк на странице
            },
        },
    });

    return (
        <div className="p-4 space-y-4 border rounded-xl bg-white shadow-sm">
            {/* ---------------------------------------------
           ТАБЛИЦА
      ------------------------------------------------ */}
            <table className="w-full border-collapse">
                <thead className="bg-neutral-100">
                    {/* Перебор групп заголовков (они могут быть вложенными) */}
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b">
                            {/* Перебор заголовков конкретной группы */}
                            {headerGroup.headers.map((header) => {
                                // Можно ли сортировать этот столбец
                                const canSort = header.column.getCanSort();

                                // Направление сортировки (asc / desc / undefined)
                                const sortDir = header.column.getIsSorted();

                                return (
                                    <th
                                        key={header.id}
                                        // Клик по заголовку активирует сортировку
                                        onClick={
                                            canSort
                                                ? header.column.getToggleSortingHandler()
                                                : undefined
                                        }
                                        className={`p-3 text-left font-semibold text-sm text-neutral-700 select-none ${
                                            canSort ? "cursor-pointer hover:bg-neutral-200" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            {/* Рендер заголовка */}
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}

                                            {/* Значки сортировки */}
                                            {sortDir === "asc" && <span>▲</span>}
                                            {sortDir === "desc" && <span>▼</span>}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>

                {/* ------------------------
             Тело таблицы
        ------------------------- */}
                <tbody>
                    {/* Перебор всех строк после сортировки + пагинации */}
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-neutral-50">
                            {/* Перебор ячеек строки */}
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="p-3 text-sm">
                                    {/* Рендер ячейки */}
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ---------------------------------------------
           ПАГИНАЦИЯ
      ------------------------------------------------ */}
            <div className="flex items-center justify-between pt-2">
                {/* Кнопка назад */}
                <button
                    onClick={() => table.previousPage()} // переходим на предыдущую страницу
                    disabled={!table.getCanPreviousPage()} // нельзя перейти, если мы на первой
                    className="px-3 py-1.5 border rounded disabled:opacity-40"
                >
                    Назад
                </button>

                {/* Номер текущей страницы */}
                <div className="text-sm">
                    Страница {table.getState().pagination.pageIndex + 1} из {table.getPageCount()}
                </div>

                {/* Кнопка вперед */}
                <button
                    onClick={() => table.nextPage()} // переходим на следующую страницу
                    disabled={!table.getCanNextPage()} // нельзя перейти, если мы на последней
                    className="px-3 py-1.5 border rounded disabled:opacity-40"
                >
                    Вперед
                </button>
            </div>
        </div>
    );
}
