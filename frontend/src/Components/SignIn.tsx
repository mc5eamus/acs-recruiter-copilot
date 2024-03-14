import { useState } from "react";
import { CallAndChatLocator } from "@azure/communication-react";
import {
	Stack,
	TextField,
	PrimaryButton,
	Text,
	Checkbox,
} from "@fluentui/react";
import { Image } from "@fluentui/react-components";
import { createExternalUserCallWithChat, getPubSubToken } from "../Util/Negotiation";
import { containerTokens, infoContainerStyle, headerStyle, configContainerStyle, configContainerStackTokens, callContainerStackTokens } from "../Util/styles";
import { CallWithChatExperience } from "./Calling/CallWithChatExperience";

interface ConnectionProps {
	token: string;
	userId: string;
	locator: CallAndChatLocator;
	endpointUrl: string;
}

interface AppState {
	connection?: ConnectionProps;
	displayName?: string | undefined;
	pubsubUrl?: string;
}

export type Role = "recruiter" | "candidate";

// if groupId and the threadId are present in the URL, the user is joining a call as a candidate
const isCandidate = (): boolean => {
	const urlParams = new URLSearchParams(window.location.search);
	const groupId = urlParams.get("groupId");
	const threadId = urlParams.get("threadId");
	return !!(groupId && threadId);
};

function App() {
	const [state, setState] = useState<AppState>({});
	const [role, setRole] = useState<Role>(isCandidate() ? "candidate" : "recruiter");
	const [joinUrl, setJoinUrl] = useState<string>(isCandidate() ? window.location.href : "");
	const [joinCall, setJoinCall] = useState<boolean>(isCandidate());

	const startCall = async () => {
		const callInfo = await createExternalUserCallWithChat(
			state.displayName || "Anonymous"
		);
		const pubsubUrl = await getPubSubToken(
			callInfo.locator.callLocator.groupId + "-" + role
		);
		setState((s) => ({ ...s, connection: callInfo, pubsubUrl: pubsubUrl }));
	};


	return (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100vh",
						width: "100vw",
					}}
				>
			{!state.connection && (
				<>
					<div
						style={{
							display: "flex",
							flex: 2,
							height: "100vh",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 1000,
							boxShadow: "0 0 30px 0 rgba(0, 0, 0, 0.3)",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: "5rem",
							}}
							>
							<div
								style={{
									width: "15rem",
								}}
								>
								<Image
									src='/logo.png'
									fit='contain'
								/>
							</div>
							<div
								style={{
									display: "flex",
									boxShadow: "0 0 15px 0 rgba(0, 0, 0, 0.2)",
									border: "1px solid #e8e8e8",
									padding: "3rem",
									borderRadius: "1rem",
									width: "30rem",	
								}}
							>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										minWidth: "100%",
									}}
								>


										<Text variant="xLarge" >
											Welcome to Recruiter Copilot
										</Text>
										<Stack
											tokens={configContainerStackTokens}
										>
											<Stack tokens={callContainerStackTokens}></Stack>
											<TextField
												autoComplete="off"
												label="Your name"
												required={true}
												onChange={(e, v) => setState((s) => ({ ...s, displayName: v }))}
												placeholder="Please enter your display name"
											/>
											<Checkbox
												label="Are you joining a call?"
												defaultChecked={joinCall}
												onChange={() => setJoinCall(!joinCall)}
											/>
											{joinCall && (
												<TextField
													autoComplete="off"
													label="Connection string"
													required={true}
													defaultValue={isCandidate() ? joinUrl : ""}
													onChange={(e, v) => setJoinUrl(v ?? "")}
													placeholder="Please enter a connection string"
												/>
											)}
											<PrimaryButton
												onClick={startCall}
												// disabled if no display name while joining call is not clicked, or if no display name and no join url
												disabled={!(state.displayName && (joinCall ? joinUrl : true))}
												text="Start call"
											/>
										</Stack>
								</div>
							</div>
						</div>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flex: 1,
							height: "100vh",
						}}
						>
						<Image
							src='https://images.unsplash.com/photo-1706273931417-8110e9fc33c9?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
							fit='cover'
							/>
					</div>
							</>
			)}
			{state.connection && state.pubsubUrl && (
				<CallWithChatExperience
				endpointUrl={state.connection.endpointUrl}
				userId={{ communicationUserId: state.connection.userId }}
				token={state.connection.token}
				displayName={state.displayName || "Anonymous"}
				locator={state.connection.locator}
				role={role}
				pubsubUrl={state.pubsubUrl}
				joinUrl={joinUrl}
				/>
				)}
			</div>
	);
}

export default App;
