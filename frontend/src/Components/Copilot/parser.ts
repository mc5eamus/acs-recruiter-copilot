import { CopilotEvaluation } from './CopilotMainPanel';

// here's an example of a message that needs to be parsed in the CopilotEvaluation structure

// summary: Reccy: Good morning, Candy. I've had a chance to review your application for the project manager position. Your experience is impressive. Could you tell me more about your approach to project management?

// Candy: Good morning, Reccy! Thanks for taking the time. Absolutely, my approach to project management is like making a perfect latte. It’s about keeping the team motivated and the ideas fresh. But don't worry, I ensure no one gets burned in the process!

// Reccy: Interesting analogy, Candy. How do you handle project challenges, especially when deadlines are tight and the team is under pressure?

// Candy: Ah, the million-dollar question! When the heat’s on, I turn into a bit of a project management ninja. I believe in transparency, so I'll slice through problems with clear communication, throw in a dash of humor to keep spirits up, and always have a plan B (or plan C) up my sleeve. It's about being as flexible as a gymnast, minus the spandex, of course.

// TONE: 7/playful (The recruiter and candidate engage in light-hearted banter and tease each other in a casual and friendly manner. The conversation has an open and welcoming tone.)

// create a function utilizing regex to parse the message and return a CopilotEvaluation object
// everything between the initial "summary :" and "TONE:" is the summary. TONE: can be missing, in this case omit the data associated with it.
// TONE consists of a number and a tone identifier, separated by a forward slash. The number is the tone, and the identifier is the toneIdentifier. 
// The toneAssessmentReasoning is everything after the tone identifier in parentheses, this part is optional, if it's missing, omit the toneAssessmentReasoning field in the object.



const makeCopilotEvaluation = (summary: string, tone: string, toneIdentifier: string, toneAssessmentReasoning: string): CopilotEvaluation => {
  return {
    summary,
    tone: parseInt(tone),
    toneIdentifier,
    toneAssessmentReasoning
  }
}

export const parseCopilotEvaluationMessage = (message: string): CopilotEvaluation => {
  const summaryRegex = /summary\s*:\s*(.*?)\s*TONE\s*:\s*(\d+)\/(\w+)\s*\((.*?)\)/i;
    const summaryMatch = message.match(summaryRegex);

    if (summaryMatch) {
        const summary = summaryMatch[1].replace(/\\n/g, '').trim();
        const tone = `${summaryMatch[2]}/${summaryMatch[3]}`;
        const toneIdentifier = summaryMatch[3];
        const toneAssessmentReasoning = summaryMatch[4].replace(/\\n/g, '').trim().replace(/"/g, ''); // Remove the quotation mark (")
      return makeCopilotEvaluation(summary, tone, toneIdentifier, toneAssessmentReasoning);
  } else {
      return {};
  }
}

