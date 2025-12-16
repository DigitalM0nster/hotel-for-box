type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OnlyRequired<T> = Pick<T, RequiredKeys<T>>;
