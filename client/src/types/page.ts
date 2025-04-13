export interface Page {
    id: string;
    userId: string;
    title: string;
    blockIds: string[];
    createdAt: Date;
    updatedAt: Date;
}