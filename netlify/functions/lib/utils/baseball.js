export function outsToInnings(outs) {

    const whole =
        Math.floor(outs / 3);

    const remainder =
        outs % 3;

    return `${whole}.${remainder}`;

}