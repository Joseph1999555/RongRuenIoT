import { fetchFromSheet } from '@/app/data/api/sheetScript';
import qs from 'qs';

export async function queryString(queryObj: any ) {

    // แปลง Object เป็น Query String
    const queryString = qs.stringify(queryObj, { encodeValuesOnly: true });

    console.log('Generated Query String:', queryString);

    const response = await fetchFromSheet<any>({query: queryString });
    return response;
}