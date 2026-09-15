export class WorkspaceError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
