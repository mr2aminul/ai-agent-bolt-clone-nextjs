import * as fs from 'fs';
import * as path from 'path';

export interface ProjectType {
  type: 'nextjs' | 'react' | 'nodejs' | 'unknown';
  framework?: string;
  version?: string;
  features: string[];
}

export class ProjectDetector {
  async detectProjectType(projectPath: string): Promise<ProjectType> {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!await this.fileExists(packageJsonPath)) {
      return { type: 'unknown', features: [] };
    }

    try {
      const packageJson = JSON.parse(
        await fs.promises.readFile(packageJsonPath, 'utf-8')
      );

      return this.analyzePackageJson(packageJson, projectPath);
    } catch {
      return { type: 'unknown', features: [] };
    }
  }

  private async analyzePackageJson(packageJson: any, projectPath: string): Promise<ProjectType> {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const features: string[] = [];

    if (deps.next) {
      features.push('typescript');
      if (deps.tailwindcss) features.push('tailwindcss');
      if (deps['@supabase/supabase-js']) features.push('supabase');

      return {
        type: 'nextjs',
        framework: 'Next.js',
        version: deps.next,
        features,
      };
    }

    if (deps.react && !deps.next) {
      if (deps['react-scripts']) {
        features.push('create-react-app');
      }
      if (deps.vite) {
        features.push('vite');
      }

      return {
        type: 'react',
        framework: 'React',
        version: deps.react,
        features,
      };
    }

    return {
      type: 'nodejs',
      framework: 'Node.js',
      features,
    };
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const projectDetector = new ProjectDetector();
