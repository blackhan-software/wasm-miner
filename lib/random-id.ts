export type ID = number;
export function randomID(
    min = 0, max = 4294967296
): ID {
    return Math.floor(Math.random() * (max - min)) + min;
}
export default randomID;
