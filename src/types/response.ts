export type HttpResponse<T> = {
    statusCode: number;
    message: string;
    data: T;
    success: boolean;
}