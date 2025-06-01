// Set the LANGSMITH_API_KEY environment variable
// If you are in a non-Node environment, please use the default "langchain/hub" entrypoint and omit includeModel for providers other than OpenAI
import * as hub from "langchain/hub/node";


//From Sparse to Dense: GPT-4 Summarization with Chain of Density Prompting: https://arxiv.org/abs/2309.04269

// Forked from https://smith.langchain.com/hub/lawwu/chain_of_density?organizationId=ebbaf2eb-769b-4505-aca2-d11de10372a4 to add a better descript  ion
await hub.pull("deanmachines-ai/rag-prompt", {
  includeModel: true
});

// Generation of Q/A Pair Training Data with AI Personality Injection
await hub.pull("deanmachines-ai/chain-of-density", {
  includeModel: true
});

// See documentation here: https://python.langchain.com/v0.2/docs/tutorials/rag/
await hub.pull("deanmachines-ai/synthetic-training-data", {
  includeModel: true
});

//   {tools} Action: the action to take, should be one of [{tool_names}]
// Action Input: the input to the action
// Observation: the result of the action
//Question: {input} Thought:{agent_scratchpad}
await hub.pull("deanmachines-ai/react", {
  includeModel: true
});
//  Get Better System Prompts.
await hub.pull("deanmachines-ai/superb_system_instruction_prompt", {
  includeModel: true
});

// Scores models or already existing LangSmith runs/datasets based on custom criteria. Useful for quality checking and benchmarking.
await hub.pull("deanmachines-ai/model-evaluator", {
  includeModel: true
});

//  {task} 
await hub.pull("deanmachines-ai/prompt-maker", {
  includeModel: true
});

// In order to use a tool, you can use <tool></tool> and <tool_input></tool_input> tags. You will then get back a response in the form <observation></observation>
await hub.pull("hwchase17/xml-agent-convo", );