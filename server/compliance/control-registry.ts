import fs from 'fs';
import path from 'path';

export type ComplianceFramework = 'SOC2' | 'ISO27001' | 'GDPR' | 'CCPA' | 'SOX';

export type ControlRegistryEntry = {
  controlId: string;
  name: string;
  owner: string;
  automated: boolean;
  evidenceSources: string[];
  mappings: Record<ComplianceFramework, string[]>;
};

export class ControlRegistry {
  private readonly controls: Map<string, ControlRegistryEntry>;

  private constructor(entries: ControlRegistryEntry[]) {
    this.controls = new Map(entries.map((e) => [e.controlId, e]));
  }

  static loadFromRepo(repoRoot: string = process.cwd()): ControlRegistry {
    const mappingPath = path.resolve(repoRoot, 'server/compliance/control-mapping.json');
    const parsed = JSON.parse(fs.readFileSync(mappingPath, 'utf8')) as any;
    const entries: ControlRegistryEntry[] = (parsed.controls || []).map((c: any) => ({
      controlId: c.controlId,
      name: c.name,
      owner: c.owner,
      automated: Boolean(c.automated),
      evidenceSources: Array.isArray(c.evidenceSources) ? c.evidenceSources : [],
      mappings: {
        SOC2: (c.mappings?.SOC2 || []) as string[],
        ISO27001: (c.mappings?.ISO27001 || []) as string[],
        GDPR: (c.mappings?.GDPR || []) as string[],
        CCPA: (c.mappings?.CCPA || []) as string[],
        SOX: (c.mappings?.SOX || []) as string[],
      },
    }));
    return new ControlRegistry(entries);
  }

  listControls(): ControlRegistryEntry[] {
    return Array.from(this.controls.values());
  }

  getControl(controlId: string): ControlRegistryEntry | null {
    return this.controls.get(controlId) || null;
  }

  requireControl(controlId: string): ControlRegistryEntry {
    const c = this.getControl(controlId);
    if (!c) throw new Error(`MISSING_CONTROL:${controlId}`);
    return c;
  }

  assertMinimumCoverage(minControls: number): void {
    if (this.controls.size < minControls) {
      throw new Error(`CONTROL_COVERAGE_TOO_LOW:${this.controls.size}/${minControls}`);
    }
  }

  assertAllControlsHaveEvidenceSources(): void {
    for (const c of this.controls.values()) {
      if (!Array.isArray(c.evidenceSources) || c.evidenceSources.length === 0) {
        throw new Error(`CONTROL_MISSING_EVIDENCE_SOURCES:${c.controlId}`);
      }
    }
  }

  assertAllControlsHaveFrameworkMappings(): void {
    for (const c of this.controls.values()) {
      const mappedCount = (
        (c.mappings.SOC2?.length || 0) +
        (c.mappings.ISO27001?.length || 0) +
        (c.mappings.GDPR?.length || 0) +
        (c.mappings.CCPA?.length || 0) +
        (c.mappings.SOX?.length || 0)
      );
      if (mappedCount === 0) {
        throw new Error(`CONTROL_UNMAPPED:${c.controlId}`);
      }
    }
  }
}
