
export type KeyValue<T> = {
	[K in keyof T]: [K, T[K]];
}[keyof T];