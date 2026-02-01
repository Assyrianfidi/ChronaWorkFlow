import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { EvidenceStore } from './evidence-store.js';

export type PolicyArtifactType =
  | 'DPA'
  | 'PRIVACY_POLICY'
  | 'SECURITY_POLICY'
  | 'INCIDENT_RESPONSE_POLICY'
  | 'ACCESS_CONTROL_POLICY';

export type PolicyArtifact = {
  id: string;
  tenantId: string;
  type: PolicyArtifactType;
  version: string;
  generatedAt: string;
  title: string;
  contentMarkdown: string;
  integrityHash: string;
};

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function nowIso(): string {
  const forced = process.env.COMPLIANCE_DETERMINISTIC_TIME_ISO;
  return forced && forced.trim() ? forced : new Date().toISOString();
}

export class PolicyEngine {
  private readonly policiesDir: string;
  private readonly evidence: EvidenceStore;

  constructor(policiesDir: string = path.resolve(process.cwd(), 'server/compliance/policies'), evidence: EvidenceStore = new EvidenceStore()) {
    this.policiesDir = policiesDir;
    this.evidence = evidence;
  }

  loadPolicyTemplate(type: PolicyArtifactType): { title: string; markdown: string } {
    const fileMap: Record<PolicyArtifactType, string> = {
      DPA: 'DPA.md',
      PRIVACY_POLICY: 'PRIVACY_POLICY.md',
      SECURITY_POLICY: 'SECURITY_POLICY.md',
      INCIDENT_RESPONSE_POLICY: 'INCIDENT_RESPONSE_POLICY.md',
      ACCESS_CONTROL_POLICY: 'ACCESS_CONTROL_POLICY.md',
    };

    const filename = fileMap[type];
    const full = path.join(this.policiesDir, filename);
    const markdown = fs.readFileSync(full, 'utf8');
    const title = markdown.split('\n').find((l) => l.startsWith('# '))?.slice(2).trim() || type;
    return { title, markdown };
  }

  generatePolicyArtifact(input: { tenantId: string; type: PolicyArtifactType; version: string }): PolicyArtifact {
    const { title, markdown } = this.loadPolicyTemplate(input.type);
    const generatedAt = nowIso();

    const content = markdown
      .replaceAll('{{TENANT_ID}}', input.tenantId)
      .replaceAll('{{VERSION}}', input.version)
      .replaceAll('{{GENERATED_AT}}', generatedAt);

    const integrityHash = sha256Hex(content);
    const id = `pol_${sha256Hex(`${input.tenantId}:${input.type}:${input.version}:${integrityHash}`).slice(0, 16)}`;

    const artifact: PolicyArtifact = {
      id,
      tenantId: input.tenantId,
      type: input.type,
      version: input.version,
      generatedAt,
      title,
      contentMarkdown: content,
      integrityHash,
    };

    this.evidence.append({
      tenantId: input.tenantId,
      category: 'POLICY_ARTIFACT',
      payload: {
        policyId: artifact.id,
        type: artifact.type,
        version: artifact.version,
        integrityHash: artifact.integrityHash,
      },
    });

    return artifact;
  }
}

export const policyEngine = new PolicyEngine();
