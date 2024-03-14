import React, { ReactElement, useEffect, useState } from 'react';
import { Text, Stack } from '@fluentui/react';
import { DataVizPalette, GaugeChart, GaugeValueFormat, GaugeChartVariant } from '@fluentui/react-charting';
import CopilotContentBlock from './CopilotContentBlock';
import { LineChartEventsExample } from '../../Util/LineChartEventsExample';
import { IStyleSet, Label, ILabelStyles, Pivot, PivotItem } from '@fluentui/react';
import { ParticipantItem } from '@azure/communication-react';


const asyncSummaryContent = async (value: string, stallTime = 1000) => {
    await new Promise((resolve) => setTimeout(resolve, stallTime));
    return (
        <div
            style={{
                display: 'flex',
                maxHeight: '20vh',
                overflowY: 'auto',
            }}
        >
            <Text>
                {value}
            </Text>
        </div>
    )
}

const asyncToneContent = async (value: number, description: string | undefined) => {
    if (value < 0 || value > 10) {
        return undefined;
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
            }}
        >
            <GaugeChart
                segments={[
                    { size: 33, color: '#E87A71', legend: 'Negative' },
                    { size: 34, color: '#FFC133', legend: 'Neutral' },
                    { size: 33, color: '#81A4FF', legend: 'Positive' },
                ]}
                chartValue={value * 10}
                height={120}
                hideMinMax={false}
                variant={GaugeChartVariant.MultipleSegments}
            />
            {description &&
                <Text variant='medium'> {description} </Text>}
        </div>
    )
}

const asyncMoodHistoryContent = async (transcript: { name: string, text: string }[], myName?: string) => {
    // If the object is empty "{}" or null, return undefined
    if (Object.keys(transcript).length === 0 || transcript === null) {
        return undefined;
    } else {
        // Otherwise, return the transcript history
        console.log(transcript)

        return (
            <>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '1rem',
                    }}
                >
                    {transcript.slice(-10).map((item, index) => {
                        
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <ParticipantItem displayName={item.name}/>
                                <Text variant='medium'>{item.text}</Text>
                            </div>
                        )
                    })}

                </div>
            </>
        )
    }
}


export type CopilotEvaluation = {
    summary?: string;
    tone?: number;
    toneIdentifier?: string;
    toneAssessmentReasoning?: string;
}

export type CopilotMainPanelProps = {
    value: CopilotEvaluation,
    transcript: { name: string, text: string }[];
    myName?: string;
}

const CopilotMainPanel = (props: CopilotMainPanelProps) => {

    const [summaryContent, setSummaryContent] = useState<ReactElement>();
    const [toneContent, setToneContent] = useState<ReactElement>();
    const [liveTranscriptContent, setLiveTranscriptContent] = useState<ReactElement>();

    useEffect(() => {
        try {
            props.value.summary && asyncSummaryContent(props.value.summary)
                .then((data) => { setSummaryContent(data); });

            props.value.tone && asyncToneContent(props.value.tone, props.value.toneAssessmentReasoning)
                .then((data) => { setToneContent(data); });


            asyncMoodHistoryContent(props.transcript, props.myName).then((data) => {
                setLiveTranscriptContent(data);
            });
        } catch (error) {
            console.error(error);
        }
    }, [props.value.summary, props.value.tone, props.value.toneIdentifier, props.value.toneAssessmentReasoning, props.transcript]);


    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                padding: '1rem',
            }}
        >
            <Text variant='xLarge'>
                Recruiter Copilot
            </Text>
            <Pivot aria-label="Basic Pivot Example">
                <PivotItem
                    headerText="AI Overview"
                    headerButtonProps={{
                        'data-order': 1,
                        'data-title': 'My Files Title',
                    }}
                >
                    <div

                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflowY: 'scroll',
                            width: '30vw',
                            maxHeight: '80vh',
                            paddingTop: '1rem',
                            gap: '1rem',
                        }}
                    >
                        <CopilotContentBlock
                            title='Interview summary'
                            content={summaryContent}
                        />
                        <CopilotContentBlock
                            title={`Sentiment Analysis: ${props.value.toneIdentifier}`}
                            content={toneContent}
                        />
                    </div>
                </PivotItem>
                <PivotItem headerText="Transcript">
                    <Stack
                        tokens={{
                            childrenGap: '1rem'
                        }}
                        style={{
                            overflowY: 'auto',
                            width: '30vw',
                            paddingTop: '1rem',
                            maxHeight: '80vh',
                        }}
                    >
                        <CopilotContentBlock
                            title='Live Tanscript'
                            content={liveTranscriptContent}
                        />
                    </Stack>

                </PivotItem>
            </Pivot>

        </div>
    );
}

export default CopilotMainPanel;