export const normalizeDbRes = <T>(data: unknown): T => {
    return JSON.parse(JSON.stringify(data));
};
