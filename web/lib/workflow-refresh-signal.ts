type WorkflowRefreshSignalState = {
  version: number;
};

declare global {
  var workflowRefreshSignalState: WorkflowRefreshSignalState | undefined;
}

function getState() {
  if (!globalThis.workflowRefreshSignalState) {
    globalThis.workflowRefreshSignalState = {
      version: 0,
    };
  }
  return globalThis.workflowRefreshSignalState;
}

export function getWorkflowRefreshVersion() {
  return getState().version;
}

export function emitWorkflowRefreshSignal(source: string) {
  void source;
  const state = getState();
  state.version += 1;
}
