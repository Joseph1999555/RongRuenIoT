import { queryString } from "@/app/utils/queryString";

interface ParamProps {
    params: Promise<{ slug: string }>;
}

export default async function SensorPage({ params }: ParamProps) {

    const { slug } = await params;


    const queryObj = {
        action: 'read',
        sheet: slug,
        limit: 10,
    }
    console.log('Query Object:', queryObj);
    const response = await queryString(queryObj);
    console.log('API Response:', response);

    return (
        <div className="w-full max-w-4xl p-4 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Sensor Details</h2>
            <p>รายละเอียดของเซนเซอร์จะแสดงที่นี่</p>
        </div>
    )
}