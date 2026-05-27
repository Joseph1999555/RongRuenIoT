import { CloudRain, Cloud, Sun, CloudLightning } from "lucide-react";
import useSWR from "swr";

// ฟังก์ชันแมปปิ้งคำศัพท์สภาพอากาศเป็น Icon
export const filterWeather = (weatherMain: string) => {
    switch (weatherMain) {
        case "Clear":
            return { icon: <Sun className="w-14 h-14 xl:w-16 xl:h-16 text-amber-500 drop-shadow-lg" />, text: "ท้องฟ้าแจ่มใส" };
        case "Clouds":
            return { icon: <Cloud className="w-14 h-14 xl:w-16 xl:h-16 text-gray-400 drop-shadow-lg" />, text: "มีเมฆบางส่วน" };
        case "Rain":
        case "Drizzle":
            return { icon: <CloudRain className="w-14 h-14 xl:w-16 xl:h-16 text-blue-400 drop-shadow-lg" />, text: "ฝนตก" };
        case "Thunderstorm":
            return { icon: <CloudLightning className="w-14 h-14 xl:w-16 xl:h-16 text-purple-500 drop-shadow-lg" />, text: "พายุฝนฟ้าคะนอง" };
        default:
            return { icon: <Cloud className="w-14 h-14 xl:w-16 xl:h-16 text-slate-400 drop-shadow-lg" />, text: "กำลังวิเคราะห์สภาพอากาศ..." };
    }
};

// Fetcher สำหรับดึง OpenWeatherMap
export const fetchWeather = (url: string) => fetch(url).then((res) => res.json());

export const useWeatherDisplay = () => {
    const LAT = "13.735269828319813"; 
    const LON = "100.31390200299732";
    const API_KEY = "c14637b5635525e930fb8f2da958317a";
    const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;

    const { data: weatherData, error, isLoading } = useSWR(WEATHER_URL, fetchWeather, { refreshInterval: 600000 });

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