/**
 * Action Execution Engine
 * 
 * Executes automation actions with retry logic and error handling
 */

import {
  AutomationAction,
  AutomationActionType,
  ActionExecutionResult,
  SendEmailActionConfig,
  SendNotificationActionConfig,
  GenerateReportActionConfig,
  LockActionConfig,
  FlagTransactionActionConfig,
  CreateTaskActionConfig,
  NotifyRoleActionConfig,
  WebhookActionConfig,
  UpdateFieldActionConfig,
  CreateApprovalRequestActionConfig,
} from './types';

/**
 * Execute a single action
 */
export async function executeAction(
  action: AutomationAction,
  context: Record<string, any>,
  isDryRun: boolean = false
): Promise<ActionExecutionResult> {
  const startTime = Date.now();

  try {
    let result: any;

    if (isDryRun) {
      result = { dryRun: true, action: action.type, wouldExecute: true };
    } else {
      switch (action.type) {
        case AutomationActionType.SEND_EMAIL:
          result = await executeSendEmail(action.config as SendEmailActionConfig, context);
          break;

        case AutomationActionType.SEND_IN_APP_NOTIFICATION:
          result = await executeSendNotification(
            action.config as SendNotificationActionConfig,
            context
          );
          break;

        case AutomationActionType.GENERATE_REPORT:
          result = await executeGenerateReport(
            action.config as GenerateReportActionConfig,
            context
          );
          break;

        case AutomationActionType.LOCK_ACTION:
          result = await executeLockAction(action.config as LockActionConfig, context);
          break;

        case AutomationActionType.FLAG_TRANSACTION:
          result = await executeFlagTransaction(
            action.config as FlagTransactionActionConfig,
            context
          );
          break;

        case AutomationActionType.CREATE_TASK:
          result = await executeCreateTask(action.config as CreateTaskActionConfig, context);
          break;

        case AutomationActionType.NOTIFY_ROLE:
          result = await executeNotifyRole(action.config as NotifyRoleActionConfig, context);
          break;

        case AutomationActionType.WEBHOOK:
          result = await executeWebhook(action.config as WebhookActionConfig, context);
          break;

        case AutomationActionType.UPDATE_FIELD:
          result = await executeUpdateField(action.config as UpdateFieldActionConfig, context);
          break;

        case AutomationActionType.CREATE_APPROVAL_REQUEST:
          result = await executeCreateApprovalRequest(
            action.config as CreateApprovalRequestActionConfig,
            context
          );
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      action,
      success: true,
      result,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    return {
      action,
      success: false,
      error: error.message || 'Unknown error',
      executionTime,
    };
  }
}

/**
 * Execute multiple actions in sequence
 */
export async function executeActions(
  actions: AutomationAction[],
  context: Record<string, any>,
  isDryRun: boolean = false
): Promise<ActionExecutionResult[]> {
  const results: ActionExecutionResult[] = [];

  for (const action of actions) {
    const result = await executeAction(action, context, isDryRun);
    results.push(result);

    // Stop execution if action failed and continueOnFailure is false
    if (!result.success && !action.continueOnFailure) {
      console.log(`[AUTOMATION] Stopping execution due to failed action: ${action.type}`);
      break;
    }
  }

  return results;
}

// Action Executors

async function executeSendEmail(
  config: SendEmailActionConfig,
  context: Record<string, any>
): Promise<any> {
  // Replace template variables in subject and body
  const subject = replaceTemplateVariables(config.subject, context);
  const body = replaceTemplateVariables(config.body, context);

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log('[AUTOMATION] Sending email:', {
    to: config.to,
    subject,
    body: body.substring(0, 100) + '...',
  });

  return {
    sent: true,
    recipients: Array.isArray(config.to) ? config.to : [config.to],
    subject,
  };
}

async function executeSendNotification(
  config: SendNotificationActionConfig,
  context: Record<string, any>
): Promise<any> {
  const title = replaceTemplateVariables(config.title, context);
  const message = replaceTemplateVariables(config.message, context);

  // TODO: Integrate with notification service
  console.log('[AUTOMATION] Sending notification:', {
    title,
    message: message.substring(0, 100) + '...',
    severity: config.severity,
  });

  return {
    sent: true,
    recipientRoles: config.recipientRoles || [],
    recipientUserIds: config.recipientUserIds || [],
  };
}

async function executeGenerateReport(
  config: GenerateReportActionConfig,
  context: Record<string, any>
): Promise<any> {
  // TODO: Integrate with report generation service
  console.log('[AUTOMATION] Generating report:', {
    reportType: config.reportType,
    parameters: config.parameters,
  });

  return {
    generated: true,
    reportType: config.reportType,
    deliveryMethod: config.deliveryMethod,
  };
}

async function executeLockAction(
  config: LockActionConfig,
  context: Record<string, any>
): Promise<any> {
  // TODO: Implement resource locking
  console.log('[AUTOMATION] Locking resource:', {
    resourceType: config.resourceType,
    resourceId: config.resourceId,
    reason: config.reason,
  });

  return {
    locked: true,
    resourceType: config.resourceType,
    resourceId: config.resourceId,
  };
}

async function executeFlagTransaction(
  config: FlagTransactionActionConfig,
  context: Record<string, any>
): Promise<any> {
  // TODO: Implement transaction flagging
  console.log('[AUTOMATION] Flagging transaction:', {
    transactionId: config.transactionId,
    flagType: config.flagType,
    reason: config.reason,
  });

  return {
    flagged: true,
    transactionId: config.transactionId,
    flagType: config.flagType,
  };
}

async function executeCreateTask(
  config: CreateTaskActionConfig,
  context: Record<string, any>
): Promise<any> {
  const title = replaceTemplateVariables(config.title, context);
  const description = replaceTemplateVariables(config.description, context);

  // TODO: Integrate with task management system
  console.log('[AUTOMATION] Creating task:', {
    title,
    description: description.substring(0, 100) + '...',
    priority: config.priority,
  });

  return {
    created: true,
    title,
    assignedTo: config.assignedToRole || config.assignedToUserId,
  };
}

async function executeNotifyRole(
  config: NotifyRoleActionConfig,
  context: Record<string, any>
): Promise<any> {
  const message = replaceTemplateVariables(config.message, context);

  // TODO: Notify all users with specified roles
  console.log('[AUTOMATION] Notifying roles:', {
    roles: config.roles,
    message: message.substring(0, 100) + '...',
    channel: config.channel,
  });

  return {
    notified: true,
    roles: config.roles,
    channel: config.channel,
  };
}

async function executeWebhook(
  config: WebhookActionConfig,
  context: Record<string, any>
): Promise<any> {
  // TODO: Make HTTP request to webhook URL
  console.log('[AUTOMATION] Calling webhook:', {
    url: config.url,
    method: config.method,
  });

  // Simulate webhook call
  return {
    called: true,
    url: config.url,
    method: config.method,
    statusCode: 200,
  };
}

async function executeUpdateField(
  config: UpdateFieldActionConfig,
  context: Record<string, any>
): Promise<any> {
  // TODO: Update resource field in database
  console.log('[AUTOMATION] Updating field:', {
    resourceType: config.resourceType,
    resourceId: config.resourceId,
    field: config.field,
    value: config.value,
  });

  return {
    updated: true,
    resourceType: config.resourceType,
    resourceId: config.resourceId,
    field: config.field,
  };
}

async function executeCreateApprovalRequest(
  config: CreateApprovalRequestActionConfig,
  context: Record<string, any>
): Promise<any> {
  const title = replaceTemplateVariables(config.title, context);
  const description = replaceTemplateVariables(config.description, context);

  // TODO: Create approval request in workflow system
  console.log('[AUTOMATION] Creating approval request:', {
    title,
    description: description.substring(0, 100) + '...',
    approverRoles: config.approverRoles,
  });

  return {
    created: true,
    title,
    approverRoles: config.approverRoles,
  };
}

/**
 * Replace template variables in strings
 * e.g., "Invoice {{invoice.number}} is overdue" with context { invoice: { number: "INV-001" } }
 */
function replaceTemplateVariables(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let value: any = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * Retry action execution with exponential backoff
 */
export async function executeActionWithRetry(
  action: AutomationAction,
  context: Record<string, any>,
  isDryRun: boolean = false,
  maxRetries: number = 3
): Promise<ActionExecutionResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await executeAction(action, context, isDryRun);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[AUTOMATION] Retrying action ${action.type} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  return {
    action,
    success: false,
    error: `Failed after ${maxRetries} retries: ${lastError}`,
    executionTime: 0,
  };
}
