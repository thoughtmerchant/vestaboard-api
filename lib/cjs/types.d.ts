import { Method } from 'axios';
export type BoardCharArray = [Line, Line, Line, Line, Line, Line];
export type Line = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
export declare enum VestaboardControlMode {
    Subscription = "subscription",
    RW = "rw",
    Local = "local"
}
export interface SubscriptionAPIConfig {
    apiKey: string;
    apiSecret: string;
}
export interface RWAPIConfig {
    apiReadWriteKey: string;
}
export interface LocalAPIConfigWithKey {
    localIPAddress: string;
    localApiKey: string;
    localAPIEnablementToken?: string;
}
export interface LocalAPIConfigWithToken {
    localIPAddress: string;
    localAPIEnablementToken: string;
    localApiKey?: string;
}
export type LocalAPIConfig = LocalAPIConfigWithKey | LocalAPIConfigWithToken;
export type APIConfig = SubscriptionAPIConfig | RWAPIConfig | LocalAPIConfig;
export interface APIOptions {
    data?: string;
    method: Method;
}
export interface Subscription {
    id: string;
    boardId: string;
}
export interface ViewerResponse {
    _id: string;
    _created: number;
    type: string;
    installation: {
        _id: string;
    };
}
export interface MessageResponse {
    id: string;
    text?: string | null;
    created: number;
    muted: boolean;
}
export interface RWBoardReadResponse {
    currentMessage: {
        layout: string;
        id: string;
    };
}
export interface RWBoardParsed {
    currentMessage: {
        layout: BoardCharArray;
        id: string;
    };
}
export interface RWMesageResponse {
    status: string;
    id: string;
    created: number;
}
export interface LocalEnablementResponse {
    message: string;
    apiKey: string;
}
export interface LocalGetCurrentMessageResponse {
    message: BoardCharArray;
}
export interface LocalPostResponse {
    ok: boolean;
}
export interface LocalReadResponse {
    message: BoardCharArray;
}
