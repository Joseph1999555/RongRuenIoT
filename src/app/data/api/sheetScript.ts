import axios, { AxiosError } from "axios";

interface ErrorResponse {
    message?: string;
    error?: string;
}

const DEFAULT_SHEET_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycby1GKJ3vWPFS8BjV8U6mxNNXmj5ZAdNTQBt4QMDAX7k6YfsPKp665sczrpBqQNB1sKE/exec";

export async function fetchFromSheet<T>({
    action,
    sheet,
    limit,
    query
}: {
    query?: string;
    action?: string;
    sheet?: string;
    limit?: number;
}): Promise<T> {
    const endpoint = process.env.SHEET_SCRIPT_URL ?? DEFAULT_SHEET_SCRIPT_URL;

    try {
        let customParams: Record<string, string> = {};

        if (query) {
            const searchParams = new URLSearchParams(query);
            customParams = Object.fromEntries(searchParams.entries());
        }

        const response = await axios.get<T>(
            endpoint,
            {
                params: {
                    action: action || undefined,
                    sheet: sheet || undefined,
                    limit: limit || undefined,
                    ...customParams,
                    _t: Date.now(),
                },
                timeout: 30000 
            }
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
            
            const userMessage = serverMessage || getErrorMessage(status);
            throw new Error(userMessage);
        }

        console.error('Unexpected Error:', error);
        throw new Error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    }

    function getErrorMessage(status: number): string {
        const messages: Record<number, string> = {
            400: 'ข้อมูลไม่ถูกต้อง',
            401: 'กรุณาเข้าสู่ระบบใหม่',
            403: 'ไม่มีสิทธิ์เข้าถึง',
            404: 'ไม่พบข้อมูล',
            429: 'กรุณารอสักครู่แล้วลองใหม่',
            500: 'เซิร์ฟเวอร์มีปัญหา',
        };
        return messages[status] || `เกิดข้อผิดพลาด (${status})`;
    }
}
