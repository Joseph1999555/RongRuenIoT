import axios, { AxiosError } from "axios";

interface ErrorResponse {
    message?: string;
    error?: string;
}

//ใช้ดึงข้อมูลจาก Strapi API 
export async function fetchFromSheet<T>({
    action,
    sheet,
    limit,
    query
}: {
    query?: string;
    action? : string;
    sheet? : string;
    limit?: number;
}): Promise<T>{
    try {
        const actionParam = action ? `action=${action}` : '';
        const sheetParam = sheet ? `&sheet=${sheet}` : '';
        const limitParam = limit ? `&limit=${limit}` : '';
        const queryParam = query ? `${query}` : '';

        const fullPath = `${queryParam}${actionParam}${sheetParam}${limitParam}`;
        const response = await axios.get<T>(
            `https://script.google.com/macros/s/AKfycbynj8rEVT7HX2x920JbZSi_rVz7qPqlEnufCDSNsPxPFYKLndczSRoaPgVQ1cUVRSUB/exec?${fullPath}`
            , { timeout: 10000 }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<ErrorResponse>;
            // Network/Timeout Error
            if (!axiosError.response) {
                const errorMsg = axiosError.code === 'ECONNABORTED'
                    ? 'การเชื่อมต่อหมดเวลา'
                    : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์';

                console.error('Network Error:', axiosError.message);
                throw new Error(errorMsg);
            }

            // HTTP Error
            const { status, data } = axiosError.response;
            const serverMessage = data?.message || data?.error;
            console.error(`API Error ${status}:`, serverMessage || data);
            // Throw user-friendly message
            const userMessage = serverMessage || getErrorMessage(status);
            throw new Error(userMessage);
        }

        // Unknown Error
        console.error('Unexpected Error:', error);
        throw new Error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    }

    function getErrorMessage(status: number): string {
        const messages: Record<number, string> = {
            400: 'ข้อมูลไม่ถูกต้อง',
            401: 'กรุณาเข้าสู่ระบบใหม่',
            403: 'ไม่มีสิทธิ์เข้าถึง',
            404: 'ไม่พบข้อมูลบทความ',
            429: 'กรุณารอสักครู่แล้วลองใหม่',
            500: 'เซิร์ฟเวอร์มีปัญหา',
        };
        return messages[status] || `เกิดข้อผิดพลาด (${status})`;
    }
}