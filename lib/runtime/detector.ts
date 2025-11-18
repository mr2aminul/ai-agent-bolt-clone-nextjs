import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface RuntimeInfo {
  runtime: 'node' | 'php' | 'python' | 'unknown';
  version: string | null;
  installed: boolean;
  path: string | null;
  packageManager?: string;
  packageManagerVersion?: string;
}

export interface ProjectConfig {
  buildCommand?: string;
  devCommand?: string;
  testCommand?: string;
  installCommand?: string;
  environmentVariables?: Record<string, string>;
}

export class RuntimeDetector {
  async detectNodeJS(): Promise<RuntimeInfo> {
    try {
      const { stdout: version } = await execAsync('node --version');
      const { stdout: nodePath } = await execAsync('where node').catch(() =>
        execAsync('which node')
      );

      let packageManager = 'npm';
      let packageManagerVersion: string | undefined;

      try {
        const { stdout: npmVersion } = await execAsync('npm --version');
        packageManagerVersion = npmVersion.trim();
      } catch {
        packageManagerVersion = undefined;
      }

      try {
        await execAsync('yarn --version');
        packageManager = 'yarn';
      } catch {
        // npm is default
      }

      try {
        await execAsync('pnpm --version');
        packageManager = 'pnpm';
      } catch {
        // keep previous value
      }

      return {
        runtime: 'node',
        version: version.trim(),
        installed: true,
        path: nodePath.trim().split('\n')[0],
        packageManager,
        packageManagerVersion,
      };
    } catch (error) {
      return {
        runtime: 'node',
        version: null,
        installed: false,
        path: null,
      };
    }
  }

  async detectPHP(): Promise<RuntimeInfo> {
    try {
      const { stdout: version } = await execAsync('php --version');
      const { stdout: phpPath } = await execAsync('where php').catch(() =>
        execAsync('which php')
      );

      const versionMatch = version.match(/PHP (\d+\.\d+\.\d+)/);
      const extractedVersion = versionMatch ? versionMatch[1] : version.split('\n')[0];

      let packageManager: string | undefined;
      let packageManagerVersion: string | undefined;

      try {
        const { stdout: composerVersion } = await execAsync('composer --version');
        packageManager = 'composer';
        const composerMatch = composerVersion.match(/Composer version (\d+\.\d+\.\d+)/);
        packageManagerVersion = composerMatch ? composerMatch[1] : undefined;
      } catch {
        packageManager = undefined;
      }

      return {
        runtime: 'php',
        version: extractedVersion.trim(),
        installed: true,
        path: phpPath.trim().split('\n')[0],
        packageManager,
        packageManagerVersion,
      };
    } catch (error) {
      return {
        runtime: 'php',
        version: null,
        installed: false,
        path: null,
      };
    }
  }

  async detectPython(): Promise<RuntimeInfo> {
    const pythonCommands = ['python', 'python3', 'py'];

    for (const cmd of pythonCommands) {
      try {
        const { stdout: version } = await execAsync(`${cmd} --version`);
        const { stdout: pythonPath } = await execAsync(`where ${cmd}`).catch(() =>
          execAsync(`which ${cmd}`)
        );

        const versionMatch = version.match(/Python (\d+\.\d+\.\d+)/);
        const extractedVersion = versionMatch ? versionMatch[1] : version.trim();

        let packageManager: string | undefined;
        let packageManagerVersion: string | undefined;

        try {
          const { stdout: pipVersion } = await execAsync(`${cmd} -m pip --version`);
          packageManager = 'pip';
          const pipMatch = pipVersion.match(/pip (\d+\.\d+\.\d+?)/);
          packageManagerVersion = pipMatch ? pipMatch[1] : undefined;
        } catch {
          packageManager = undefined;
        }

        return {
          runtime: 'python',
          version: extractedVersion,
          installed: true,
          path: pythonPath.trim().split('\n')[0],
          packageManager,
          packageManagerVersion,
        };
      } catch {
        continue;
      }
    }

    return {
      runtime: 'python',
      version: null,
      installed: false,
      path: null,
    };
  }

  async detectAll(): Promise<{
    node: RuntimeInfo;
    php: RuntimeInfo;
    python: RuntimeInfo;
  }> {
    const [node, php, python] = await Promise.all([
      this.detectNodeJS(),
      this.detectPHP(),
      this.detectPython(),
    ]);

    return { node, php, python };
  }

  async generateProjectConfig(
    projectPath: string,
    projectType: string,
    framework?: string
  ): Promise<ProjectConfig> {
    const config: ProjectConfig = {
      environmentVariables: {},
    };

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          await fs.promises.readFile(packageJsonPath, 'utf-8')
        );
        const scripts = packageJson.scripts || {};

        if (scripts.build) config.buildCommand = 'npm run build';
        if (scripts.dev) config.devCommand = 'npm run dev';
        if (scripts.start && !scripts.dev) config.devCommand = 'npm run start';
        if (scripts.test) config.testCommand = 'npm run test';
        config.installCommand = 'npm install';

        return config;
      } catch (error) {
        console.error('Failed to parse package.json:', error);
      }
    }

    const composerJsonPath = path.join(projectPath, 'composer.json');
    if (await this.fileExists(composerJsonPath)) {
      try {
        const composerJson = JSON.parse(
          await fs.promises.readFile(composerJsonPath, 'utf-8')
        );
        const scripts = composerJson.scripts || {};

        config.installCommand = 'composer install';

        if (framework === 'Laravel') {
          config.buildCommand = 'npm run build';
          config.devCommand = 'php artisan serve';
          config.testCommand = 'php artisan test';
        } else if (scripts.test) {
          config.testCommand = 'composer test';
        }

        return config;
      } catch (error) {
        console.error('Failed to parse composer.json:', error);
      }
    }

    const requirementsPath = path.join(projectPath, 'requirements.txt');
    if (await this.fileExists(requirementsPath)) {
      config.installCommand = 'pip install -r requirements.txt';

      if (framework === 'Django') {
        config.devCommand = 'python manage.py runserver';
        config.testCommand = 'python manage.py test';
      } else if (framework === 'Flask') {
        config.devCommand = 'flask run';
        config.testCommand = 'pytest';
        config.environmentVariables = {
          FLASK_APP: 'app.py',
          FLASK_ENV: 'development',
        };
      } else if (framework === 'FastAPI') {
        config.devCommand = 'uvicorn main:app --reload';
        config.testCommand = 'pytest';
      }

      return config;
    }

    return config;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async saveProjectConfig(projectPath: string, config: ProjectConfig): Promise<void> {
    const configPath = path.join(projectPath, '.bolt.config.json');
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  async loadProjectConfig(projectPath: string): Promise<ProjectConfig | null> {
    const configPath = path.join(projectPath, '.bolt.config.json');
    try {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

export const runtimeDetector = new RuntimeDetector();
