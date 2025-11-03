declare module 'react-native-mmkv' {
  export class MMKV {
    constructor(options?: { id?: string; path?: string; encryptionKey?: string });
    set(key: string, value: string | number | boolean): void;
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    delete(key: string): void;
    clearAll(): void;
  }
}
