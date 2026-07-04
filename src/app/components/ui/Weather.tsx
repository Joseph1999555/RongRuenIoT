import { CloudRain, Cloud, Sun, CloudLightning } from "lucide-react";
import useSWR from "swr";

interface WeatherApiResponse {
    weather?: { main?: string }[];
    main?: {
        temp_max?: number;
        temp_min?: number;
    };
    message?: string;
}

export const filterWeather = (weatherMain: string) => {
    switch (weatherMain) {
        case "Clear":
            return { icon: <Sun className="h-12 w-12 text-amber-500" />, text: "ท้องฟ้าแจ่มใส" };
        case "Clouds":
            return { icon: <Cloud className="h-12 w-12 text-slate-400" />, text: "มีเมฆบางส่วน" };
        case "Rain":
        case "Drizzle":
            return { icon: <CloudRain className="h-12 w-12 text-sky-500" />, text: "ฝนตก" };
        case "Thunderstorm":
            return { icon: <CloudLightning className="h-12 w-12 text-violet-500" />, text: "พายุฝนฟ้าคะนอง" };
        default:
            return { icon: <Cloud className="h-12 w-12 text-slate-400" />, text: "กำลังวิเคราะห์สภาพอากาศ..." };
    }
};

export const fetchWeather = async (url: string): Promise<WeatherApiResponse> => {
    const response = await fetch(url);

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? "Unable to load weather data");
    }

    return response.json();
};

export const useWeatherDisplay = () => {
    const { data: weatherData, error, isLoading } = useSWR("/api/weather", fetchWeather, {
        dedupingInterval: 60000,
        errorRetryCount: 3,
        errorRetryInterval: 30000,
        refreshInterval: 600000,
        revalidateOnFocus: false,
    });

    const weatherStatus = weatherData?.weather?.[0]?.main || "Unknown";
    const weatherDesc = filterWeather(weatherStatus);
    const tempMax = weatherData?.main?.temp_max ? Math.round(weatherData.main.temp_max) : "-";
    const tempMin = weatherData?.main?.temp_min ? Math.round(weatherData.main.temp_min) : "-";
    
    return {
        weatherDesc,
        tempMax,
        tempMin,
        isLoading,
        error
    };
};
