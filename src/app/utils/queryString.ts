import { fetchFromSheet } from '@/app/data/api/sheetFetch';
import qs from 'qs';

export type SheetQuery = Record<string, string | number | boolean | undefined>;

export async function queryString<T = unknown>(queryObj: SheetQuery): Promise<T> {
    const query = qs.stringify(queryObj, { encodeValuesOnly: true });
    const sheet = queryObj.sheet === undefined ? "all" : String(queryObj.sheet);
    const response = await fetchFromSheet<T>({
        query,
        tags: ["sensors", `sensors:${sheet}`],
    });
    return response;
}
