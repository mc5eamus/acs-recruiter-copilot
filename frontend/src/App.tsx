import { CallAndChatLocator, FluentThemeProvider } from '@azure/communication-react';
import SignIn from './Components/SignIn';
import { theme } from './theme';

interface ConnectionProps {
	token: string;
	userId: string;
	locator: CallAndChatLocator;
	endpointUrl: string;
};

interface AppState {
	connection?: ConnectionProps;
	displayName?: string | undefined;
}

export type Role = "recruiter" | "candidate";

function App() {
	return (
		<FluentThemeProvider fluentTheme={theme}>
			<div
				className="App"
				style={{
					height: "100vh",
					width: "100vw",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<SignIn />
			</div>
		</FluentThemeProvider>
	);
}

export default App;
