/**
 * Registry of known Bubble workflows with their schemas.
 *
 * This file serves two purposes:
 * 1. Documentation: See all available workflows and their expected types
 * 2. Runtime validation: Use Zod schemas to validate responses
 *
 * This file can be updated manually or via:
 *   npm run discover-workflow <name> --save-registry
 *
 * Usage in interfaces:
 *   import { BUBBLE_WORKFLOWS, type WorkflowResponse } from '@/config/bubble-workflows';
 *
 *   const result = await services.callBubbleWorkflow(
 *     BUBBLE_WORKFLOWS.getUserProfile.name,
 *     { user_id: '123' }
 *   ) as WorkflowResponse<'getUserProfile'>;
 */

import { z } from 'zod';

// ============================================================================
// Workflow Definitions
// ============================================================================

/**
 * Registry of all known Bubble workflows.
 *
 * Add new workflows as they are discovered using:
 *   npm run discover-workflow <workflow_name>
 *
 * Then copy the generated Zod schema here.
 */
export const BUBBLE_WORKFLOWS = {
  /**
   * Example workflow - replace with actual workflows
   * This demonstrates the expected structure for workflow entries.
   */
  example: {
    /** The exact Bubble workflow name */
    name: 'example_workflow',

    /** HTTP method (usually POST for workflows) */
    method: 'POST' as const,

    /** Human-readable description */
    description: 'Example workflow - replace with real workflows',

    /** Zod schema for validating request parameters */
    paramsSchema: z.object({
      example_param: z.string().optional(),
    }),

    /** Zod schema for validating the response */
    responseSchema: z.object({
      status: z.string(),
      response: z.object({
        message: z.string().optional(),
        data: z.unknown().optional(),
      }),
    }),
  },

  // Add more workflows below as they are discovered
  // Example:
  //
  // getUserProfile: {
  //   name: 'get_user_profile',
  //   method: 'POST' as const,
  //   description: 'Fetches user profile data',
  //   paramsSchema: z.object({
  //     user_id: z.string(),
  //   }),
  //   responseSchema: z.object({
  //     status: z.string(),
  //     response: z.object({
  //       user: z.object({
  //         _id: z.string(),
  //         email: z.string(),
  //         name: z.string(),
  //       }),
  //     }),
  //   }),
  // },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Type representing all defined workflows
 */
export type BubbleWorkflows = typeof BUBBLE_WORKFLOWS;

/**
 * Union type of all workflow keys (e.g., 'example' | 'getUserProfile')
 */
export type WorkflowName = keyof BubbleWorkflows;

/**
 * Extract the response type from a workflow's responseSchema
 *
 * Usage:
 *   type ProfileResponse = WorkflowResponse<'getUserProfile'>;
 */
export type WorkflowResponse<T extends WorkflowName> = z.infer<
  BubbleWorkflows[T]['responseSchema']
>;

/**
 * Extract the params type from a workflow's paramsSchema
 *
 * Usage:
 *   type ProfileParams = WorkflowParams<'getUserProfile'>;
 */
export type WorkflowParams<T extends WorkflowName> = z.infer<
  BubbleWorkflows[T]['paramsSchema']
>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate a workflow response against its schema
 *
 * @param workflowKey - The workflow key from BUBBLE_WORKFLOWS
 * @param response - The response to validate
 * @returns The validated response (typed)
 * @throws ZodError if validation fails
 *
 * Usage:
 *   const rawResult = await services.callBubbleWorkflow('get_user_profile', params);
 *   const validatedResult = validateWorkflowResponse('getUserProfile', rawResult);
 */
export function validateWorkflowResponse<T extends WorkflowName>(
  workflowKey: T,
  response: unknown
): WorkflowResponse<T> {
  const workflow = BUBBLE_WORKFLOWS[workflowKey];
  return workflow.responseSchema.parse(response) as WorkflowResponse<T>;
}

/**
 * Safely validate a workflow response, returning an error object on failure
 *
 * @param workflowKey - The workflow key from BUBBLE_WORKFLOWS
 * @param response - The response to validate
 * @returns Success object with data, or error object with issues
 *
 * Usage:
 *   const result = safeValidateWorkflowResponse('getUserProfile', rawResult);
 *   if (result.success) {
 *     // result.data is typed correctly
 *   } else {
 *     // result.error contains validation issues
 *   }
 */
export function safeValidateWorkflowResponse<T extends WorkflowName>(
  workflowKey: T,
  response: unknown
):
  | { success: true; data: WorkflowResponse<T> }
  | { success: false; error: z.ZodError } {
  const workflow = BUBBLE_WORKFLOWS[workflowKey];
  const result = workflow.responseSchema.safeParse(response);

  if (result.success) {
    return { success: true, data: result.data as WorkflowResponse<T> };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Get workflow metadata by key
 *
 * @param workflowKey - The workflow key from BUBBLE_WORKFLOWS
 * @returns The workflow definition
 */
export function getWorkflow<T extends WorkflowName>(
  workflowKey: T
): BubbleWorkflows[T] {
  return BUBBLE_WORKFLOWS[workflowKey];
}

/**
 * Get the Bubble workflow name from a registry key
 *
 * @param workflowKey - The workflow key from BUBBLE_WORKFLOWS
 * @returns The Bubble workflow name (e.g., 'get_user_profile')
 */
export function getWorkflowName<T extends WorkflowName>(workflowKey: T): string {
  return BUBBLE_WORKFLOWS[workflowKey].name;
}
