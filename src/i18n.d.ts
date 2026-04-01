import 'vue';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, ...args: any[]) => string;
    $tc: (key: string, count: number, ...args: any[]) => string;
    $te: (key: string) => boolean;
    $d: (value: number | Date, key?: string, locale?: string) => string;
    $n: (value: number, key?: string, locale?: string) => string;
    $tm: (key: string) => any;
  }
}
