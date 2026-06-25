import { fetchFromSheet } from '@/app/data/api/sheetScript';
import qs from 'qs';

export type SheetQuery = Record<string, string | number | boolean | undefined>;

export async function queryString<T = unknown>(queryObj: SheetQuery): Promise<T> {
    const query = qs.stringify(queryObj, { encodeValuesOnly: true });
    const response = await fetchFromSheet<T>({ query });
    return response;
}
