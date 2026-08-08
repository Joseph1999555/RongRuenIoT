const URL = "http://localhost:3000/api/sensors/raw";

function toHex16(value) {
    if (value < 0) {
        value = 0x10000 + value;
    }

    return value.toString(16).padStart(4, "0");
}

function buildTHRaw(temp, hum, light = 1000) {

    const humHex = toHex16(Math.round(hum * 10));
    const tempHex = toHex16(Math.round(temp * 10));
    const lightHex = toHex16(light);

    return (
        "0b03" +
        "0c" +
        humHex +
        tempHex +
        "0000" +
        lightHex +
        "00000000"
    );
}

async function send() {

    const temperature = +(28 + Math.random() * 5).toFixed(1);
    const humidity = +(60 + Math.random() * 15).toFixed(1);

    const raw = buildTHRaw(
        temperature,
        humidity
    );

    console.log("--------------------------");
    console.log("Temp :", temperature);
    console.log("Hum  :", humidity);
    console.log("Raw  :", raw);

    const body = {
        system: "A",
        sensors: [
            {
                id: 11,
                type: "TH",
                raw
            }
        ]
    };

    const response = await fetch(URL,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(body)
    });

    console.log(await response.json());
}

setInterval(send, 300000);

send();
