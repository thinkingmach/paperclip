export type ThinkingMachSemanticActionId =
  | "get_task_context"
  | "get_task_history"
  | "list_documents"
  | "read_document"
  | "list_document_revisions"
  | "report_progress"
  | "answer_status_question"
  | "write_document"
  | "request_human_input"
  | "register_deliverable"
  | "finish_task"
  | "block_task"
  | "request_review"
  | "list_agents"
  | "get_agent"
  | "search_tasks"
  | "list_approvals"
  | "get_approval"
  | "get_approval_context"
  | "get_workspace_runtime"
  | "control_workspace_service"
  | "set_dependencies"
  | "create_task"
  | "request_approval"
  | "decide_approval"
  | "comment_on_approval"
  | "schedule_wake";

export type ThinkingMachSemanticActionPlacement = "always" | "optional";
export type ThinkingMachSemanticActionMode =
  "standard" | "ask" | "planning" | "skill_test";
export type ThinkingMachSemanticActionEffect = "read" | "write" | "governance";

export type ThinkingMachJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly ThinkingMachJsonValue[]
  | { readonly [key: string]: ThinkingMachJsonValue };

/** The JSON Schema subset used by the v1 semantic action catalog. */
export interface ThinkingMachJsonSchema {
  readonly type?: string | readonly string[];
  readonly title?: string;
  readonly description?: string;
  readonly properties?: Readonly<Record<string, ThinkingMachJsonSchema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | ThinkingMachJsonSchema;
  readonly items?: ThinkingMachJsonSchema;
  readonly enum?: readonly ThinkingMachJsonValue[];
  readonly oneOf?: readonly ThinkingMachJsonSchema[];
  readonly anyOf?: readonly ThinkingMachJsonSchema[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly uniqueItems?: boolean;
  readonly pattern?: string;
  readonly format?: string;
  readonly default?: ThinkingMachJsonValue;
}

/**
 * A transport-neutral declaration. Catalog membership never grants discovery
 * or invocation authority; a run-scoped authorization layer must do that.
 */
export interface ThinkingMachSemanticActionDescriptor {
  readonly schema: "paperclip.semantic-action.v1";
  readonly operationId: ThinkingMachSemanticActionId;
  readonly version: 1;
  readonly title: string;
  readonly description: string;
  readonly placement: ThinkingMachSemanticActionPlacement;
  readonly effect: ThinkingMachSemanticActionEffect;
  readonly requiredClaims: readonly string[];
  readonly allowedModes: readonly ThinkingMachSemanticActionMode[];
  readonly allowedRoles?: readonly string[];
  readonly inputSchema: ThinkingMachJsonSchema;
  readonly outputSchema: ThinkingMachJsonSchema;
}
