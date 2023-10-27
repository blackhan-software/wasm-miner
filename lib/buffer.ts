export class Buffer {
    static async from(
        data: string, encoding: 'base64'
    ) {
        const response = await fetch(
            `data:application/octet-stream;${encoding},` + data
        );
        return response.arrayBuffer();
    }
}
export default Buffer;
