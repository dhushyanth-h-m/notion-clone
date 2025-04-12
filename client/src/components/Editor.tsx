import React, { useCallback, useState } from 'react';
import { createEditor, Descendant, Element } from 'slate';
import { Slate, Editable, withReact, RenderElementProps } from 'slate-react';

// Define custom element types
type CustomElement = { type: 'paragraph' | 'heading' | 'list'; children: CustomText[] }
type CustomText = { text: string }

declare module 'slate' {
    interface CustomTypes {
        Element: CustomElement
        Text: CustomText
    }
}

const initialValue: Descendant[] = [
    {
        type: 'paragraph',
        children: [{ text: 'Start typing...'}],
    },
];

export default function Editor() {
    const [editor] = useState(() => withReact(createEditor()));
    
    const renderElement = useCallback((props: RenderElementProps) => {
        switch (props.element.type) {
            case 'heading':
                return <h1 {...props.attributes}>{props.children}</h1>
            case 'list':
                return <ul {...props.attributes}>{props.children}</ul>
            default:
                return <p {...props.attributes}>{props.children}</p>
        }
    }, []);

    return (
        <Slate editor={editor} initialValue={initialValue}>
            <Editable
                renderElement={renderElement}
                placeholder="Type '/' to add a block..."
            />
        </Slate>
    );
}