export interface Block {
    id: string;
    type: 'text' | 'heading' | 'list'; 
    content: string; 
    children: Block[];
}