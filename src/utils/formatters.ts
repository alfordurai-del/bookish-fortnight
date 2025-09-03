// client/src/utils/formatters.ts
const formatAmount = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) {
        return "N/A";
    }
    return `US$${num.toFixed(2)}`;
};

const formatDate = (timestamp: number | string | undefined | null): string => {
    if (timestamp === undefined || timestamp === null) {
        return "Date not available";
    }
    const d = new Date(Number(timestamp));
    return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleString();
};

export { formatAmount, formatDate };