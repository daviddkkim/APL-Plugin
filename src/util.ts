export function RGBToHex(r: string, g: string, b: string) {
    let rString = Number(r).toString(16);
    let gString = Number(g).toString(16);
    let bString = Number(b).toString(16);

    if (rString.length == 1) rString = "0" + rString;
    if (gString.length == 1) gString = "0" + gString;
    if (bString.length == 1) bString = "0" + bString;

    return "#" + rString + gString + bString;
}

export function convertColor(color: RGB) {
    const colorObj = color;
    let figmaColor = {
        r: '',
        g: '',
        b: '',
        a: '',
    };

    Object.entries(colorObj).forEach(cf => {
        const [key, value] = cf;

        if (key === 'r') {
            figmaColor.r = (255 * (value as number)).toFixed(0);
        }
        if (key === 'g') {
            figmaColor.g = (255 * (value as number)).toFixed(0);
        }
        if (key === 'b') {
            figmaColor.b = (255 * (value as number)).toFixed(0);
        }
        if (key === "a") {
            figmaColor.a = value;
        }
    });
    return figmaColor;
};