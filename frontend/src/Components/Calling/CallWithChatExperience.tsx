import { Call, Features } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential, CommunicationUserIdentifier } from '@azure/communication-common';
import {
	CallAndChatLocator,
	CallWithChatComposite,
	useAzureCommunicationCallWithChatAdapter,
	CallWithChatCompositeOptions,
	CallWithChatAdapter,
	CallWithChatAdapterState,
	CustomCallControlButtonCallback,
	ParticipantItem,
} from '@azure/communication-react';
import { Theme, PartialTheme, Spinner, initializeIcons, PersonaPresence } from '@fluentui/react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import CopilotMainPanel, { CopilotEvaluation } from '../Copilot/CopilotMainPanel';
import { parseCopilotEvaluationMessage } from '../Copilot/parser';
import { theme } from '../../theme';
import { Image } from "@fluentui/react-components";
import { Role } from '../SignIn';

initializeIcons();

export type CallWithChatExperienceProps = {
	// Props needed for the construction of the CallWithChatAdapter
	userId: CommunicationUserIdentifier;
	token: string;
	displayName: string;
	endpointUrl: string;

	locator: CallAndChatLocator;
	// Role to determine the experience
	role: 'recruiter' | 'candidate';
	// Props to customize the CallWithChatComposite experience
	joinUrl?: string;
	adapter?: CallWithChatAdapter;
	fluentTheme?: PartialTheme | Theme;
	rtl?: boolean;
	compositeOptions?: CallWithChatCompositeOptions;
	formFactor?: 'desktop' | 'mobile';
	pubsubUrl: string
};

const simpleAsyncCall = async (stallTime = 200): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, stallTime));
};

export const CallWithChatExperience = (props: CallWithChatExperienceProps): JSX.Element => {
	const [clickSuccessful, setClickSuccessful] = useState(false);
	const [disabledCheck, setDisabledCheck] = useState(false);
	const isCaptionStarted = useRef(false);
	const { sendMessage, lastMessage, readyState } = useWebSocket(props.pubsubUrl)
	const [copilot, setCopilot] = useState<CopilotEvaluation>({ summary: "", tone: -1, toneIdentifier: "", toneAssessmentReasoning: "" });
	const [transcript, setTranscript] = useState<{name: string, text: string}[]>([]);

	useEffect(() => {
		const message = lastMessage?.data ? lastMessage?.data : null;
		if (message) {
			setCopilot(parseCopilotEvaluationMessage(message));
		}
	}, [lastMessage])

	const customButtonsForInjection = (role: Role): CustomCallControlButtonCallback[] => [
		() => ({
			placement: 'secondary',
			iconName: !clickSuccessful ? 'AutoEnhanceOn' : 'AutoEnhanceOff',
			strings: {
				label: 'Copilot',
				ariaLabel: 'Custom'
			},
			onItemClick: () => {
				setDisabledCheck(true);
				try {
					simpleAsyncCall().then(() => {
						setDisabledCheck(false);
						setClickSuccessful(!clickSuccessful);
					});
				} catch {
					setDisabledCheck(false);
				}
			},
			disabled: disabledCheck
		}),
		() => ({
			placement: 'secondary',
			iconName: 'Record2',
			strings: {
				label: 'Start Recording',
				ariaLabel: 'Custom'
			},
			onItemClick: () => {
				alert('Recording can start');
			},
			disabled: disabledCheck
		}), 
	];

	const connectionStatus = {
		[ReadyState.CONNECTING]: 'Connecting',
		[ReadyState.OPEN]: 'Open',
		[ReadyState.CLOSING]: 'Closing',
		[ReadyState.CLOSED]: 'Closed',
		[ReadyState.UNINSTANTIATED]: 'Uninstantiated',
	}[readyState];

	useEffect(() => {
		if (lastMessage && lastMessage.data) {
			setCopilot((value) => ({ ...value, summary: "" + lastMessage.data }));
		}
	}, [lastMessage]);

	const sendWsMessage = (eventType: string, message: object) => {
		var payload = {
			type: "event",
			event: eventType,
			dataType: "json",
			data: message,
		}

		var payloadStr = JSON.stringify(payload)
		sendMessage(payloadStr)
	}

	const afterAdapterCreate = useCallback(

		async (adapter: CallWithChatAdapter): Promise<CallWithChatAdapter> => {

			if (props.role === 'recruiter') {
				adapter.on('messageReceived', (e) => {
					console.log('messageReceived', e.message.content);
					console.log(e.message)
					const message = {
						contextId: props.locator.callLocator.groupId,
						type: 'chat',
						content: e.message.content,
						sender: e.message.senderDisplayName
					};
					
					sendWsMessage("chatMessageReceived", message)
				});
			}
			
			adapter.onStateChange(async (state: CallWithChatAdapterState) => {
				
				if (!isCaptionStarted.current && state.call && state.call.state === 'Connected' && props.role === 'recruiter') {
					isCaptionStarted.current = true;
					// Use the index properly if you want to support multiple calls
					const acsCall = (adapter as any).callAdapter.callAgent._calls[0] as Call;
					const captions = acsCall.feature(Features.Captions).captions as any;
					if (!captions.isCaptionsFeatureActive) {
						await captions.startCaptions({ spokenLanguage: 'en-us' });
					}
					captions.on('CaptionsReceived', (e: any) => {
						if (e.resultType === 'Final') {
							const message = {
								contextId: props.locator.callLocator.groupId,
								type: 'transcript',
								content: e.spokenText,
								sender: e.speaker.displayName
							};
							setTranscript((prev) => { return [...prev, { name: e.speaker.displayName, text: e.spokenText}]})
							sendWsMessage("transcriptReceived", message)
						}
					});
				}

				if (isCaptionStarted.current && (state.call === undefined || state.call.state === 'Disconnected')) {
					isCaptionStarted.current = false;
				}
			});
			return adapter;
		},
		[isCaptionStarted]
	);

	const credential = useMemo(() => new AzureCommunicationTokenCredential(props.token), [props.token]);
	const joinInvitationURL = `${window.location.href.split('?')[0]}?groupId=${props.locator.callLocator.groupId}&threadId=${encodeURIComponent(props.locator.chatThreadId)}`;

	const adapter = useAzureCommunicationCallWithChatAdapter({
		userId: props.userId,
		displayName: props.displayName,
		credential,
		locator: props.locator,
		endpoint: props.endpointUrl
	},
		afterAdapterCreate)

	// The adapter is created asynchronously by the useAzureCommunicationCallWithChatAdapter hook.
	// Here we show a spinner until the adapter has finished constructing.
	if (!adapter) {
		return (
			<div style={{
				height: '100vh',
				width: '100vw',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
			>
				<Spinner label="Initializing..." />
			</div>
		);
	} else {
		return (
			<div
				style={{
					height: '100vh',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<div
					style={{
						display: 'flex',
						height: '5rem',
						boxShadow: '0 0 20px 0 rgba(0, 0, 0, 0.2)',
						justifyContent: 'space-between',
						zIndex: 1000,
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							padding: '0 1rem',
						}}
					>
						<Image
							src='/logo.png'
							height={60}
						/>

					</div>
					<ParticipantItem displayName={adapter.getState().displayName} presence={PersonaPresence.online} />
				</div>
				<div
					style={{
						height: '100vh',
						width: '100vw',
						display: 'flex',
						justifyContent: 'space-between',
					}}
				>
					<CallWithChatComposite
						fluentTheme={theme}
						adapter={adapter}
						rtl={props.rtl}
						formFactor={props.formFactor}
						options={{
							callControls: {
								raiseHandButton: false,
								onFetchCustomButtonProps: props.role=='recruiter' ? customButtonsForInjection(props.role) : undefined,
							},
						}}
						joinInvitationURL={joinInvitationURL}
					/>
					{clickSuccessful && <CopilotMainPanel value={copilot} transcript={transcript} myName={adapter.getState().displayName} />}
				</div>
			</div>

		);
	}
};