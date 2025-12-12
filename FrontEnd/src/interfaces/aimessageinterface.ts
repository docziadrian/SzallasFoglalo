export interface AIMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}