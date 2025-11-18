import { codeEntityQueries, codeImportQueries, codeExportQueries } from './db/queries';

export interface DependencyGraph {
  imports: Map<string, string[]>;
  exports: Map<string, string[]>;
  usages: Map<string, string[]>;
}

export class DependencyTracker {
  async buildGraph(projectId: string, fileIds: string[]): Promise<DependencyGraph> {
    const graph: DependencyGraph = {
      imports: new Map(),
      exports: new Map(),
      usages: new Map(),
    };

    for (const fileId of fileIds) {
      const imports = await codeImportQueries.list(fileId);
      const exports = await codeExportQueries.list(fileId);

      imports.forEach((imp: any) => {
        const current = graph.imports.get(fileId) || [];
        graph.imports.set(fileId, [...current, imp.source]);
      });

      exports.forEach((exp: any) => {
        const current = graph.exports.get(fileId) || [];
        graph.exports.set(fileId, [...current, exp.name]);
      });
    }

    return graph;
  }

  async findDependencies(fileId: string): Promise<{
    dependencies: string[];
    dependents: string[];
  }> {
    const imports = await codeImportQueries.list(fileId);
    const dependencies = imports.map((imp: any) => imp.source);

    return {
      dependencies,
      dependents: [],
    };
  }
}

export const dependencyTracker = new DependencyTracker();
