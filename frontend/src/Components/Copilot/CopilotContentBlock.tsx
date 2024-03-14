import { Text, Spinner, Shimmer, Stack, mergeStyles, ThemeProvider } from '@fluentui/react';
import React, { useEffect, useState } from 'react';

const loadingComponent = () => {
    return (
        <div
            style={{
                display: 'grid',
                width: '100%',
                gap: '1rem',
            }}
        >
            <Shimmer/>
            <Shimmer/>
            <Shimmer/>
            <Shimmer/>
            <Shimmer width='40%' />
        </div>
    );
}


const CopilotContentBlock = (props: {title: string, content?: any}) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (props.content) {
            setLoading(false);
        }
    }, [props.content]);
    
    return ( 
        <div 
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.14)',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)',
                gap: '1rem',
            }}
            >
            <Text variant='large'>
                {props.title}
            </Text>
            {loading ? loadingComponent() : props.content}
        </div>
     );
}
 
export default CopilotContentBlock;