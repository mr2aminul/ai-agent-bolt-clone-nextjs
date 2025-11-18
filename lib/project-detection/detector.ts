import * as fs from 'fs';
import * as path from 'path';

export interface ProjectType {
  type: 'nextjs' | 'react' | 'nodejs' | 'php' | 'python' | 'unknown';
  framework?: string;
  version?: string;
  features: string[];
}

export class ProjectDetector {
  async detectProjectType(projectPath: string): Promise<ProjectType> {
    const phpDetection = await this.detectPHP(projectPath);
    if (phpDetection.type !== 'unknown') return phpDetection;

    const pythonDetection = await this.detectPython(projectPath);
    if (pythonDetection.type !== 'unknown') return pythonDetection;

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          await fs.promises.readFile(packageJsonPath, 'utf-8')
        );
        return this.analyzePackageJson(packageJson, projectPath);
      } catch {
        return { type: 'unknown', features: [] };
      }
    }

    return { type: 'unknown', features: [] };
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

  private async detectPHP(projectPath: string): Promise<ProjectType> {
    const composerJsonPath = path.join(projectPath, 'composer.json');

    if (await this.fileExists(composerJsonPath)) {
      try {
        const composerJson = JSON.parse(
          await fs.promises.readFile(composerJsonPath, 'utf-8')
        );
        return this.analyzeComposerJson(composerJson, projectPath);
      } catch {
        return { type: 'unknown', features: [] };
      }
    }

    const hasPhpFiles = await this.hasFilesWithExtension(projectPath, '.php');
    if (hasPhpFiles) {
      const framework = await this.detectPHPFramework(projectPath);
      const features = await this.detectPHPFeatures(projectPath);

      return {
        type: 'php',
        framework: framework || 'PHP',
        features,
      };
    }

    return { type: 'unknown', features: [] };
  }

  private async analyzeComposerJson(composerJson: any, projectPath: string): Promise<ProjectType> {
    const deps = { ...composerJson.require, ...composerJson['require-dev'] };
    const features: string[] = [];
    let framework = 'PHP';
    let version: string | undefined;

    if (deps['laravel/framework']) {
      framework = 'Laravel';
      version = deps['laravel/framework'];
      features.push('laravel');
      if (deps['laravel/sanctum']) features.push('sanctum');
      if (deps['laravel/passport']) features.push('passport');
      if (deps['inertiajs/inertia-laravel']) features.push('inertia');
    } else if (deps['symfony/symfony'] || deps['symfony/framework-bundle']) {
      framework = 'Symfony';
      version = deps['symfony/symfony'] || deps['symfony/framework-bundle'];
      features.push('symfony');
    } else if (deps['cakephp/cakephp']) {
      framework = 'CakePHP';
      version = deps['cakephp/cakephp'];
      features.push('cakephp');
    } else if (deps['codeigniter4/framework']) {
      framework = 'CodeIgniter';
      version = deps['codeigniter4/framework'];
      features.push('codeigniter');
    }

    if (deps['phpunit/phpunit']) features.push('phpunit');
    if (deps['doctrine/orm']) features.push('doctrine');
    if (deps['guzzlehttp/guzzle']) features.push('guzzle');

    return {
      type: 'php',
      framework,
      version,
      features,
    };
  }

  private async detectPHPFramework(projectPath: string): Promise<string | undefined> {
    if (await this.fileExists(path.join(projectPath, 'wp-config.php'))) {
      return 'WordPress';
    }
    if (await this.fileExists(path.join(projectPath, 'artisan'))) {
      return 'Laravel';
    }
    if (await this.fileExists(path.join(projectPath, 'index.php'))) {
      const content = await fs.promises.readFile(
        path.join(projectPath, 'index.php'),
        'utf-8'
      ).catch(() => '');

      if (content.includes('CodeIgniter')) return 'CodeIgniter';
      if (content.includes('Symfony')) return 'Symfony';
    }

    return undefined;
  }

  private async detectPHPFeatures(projectPath: string): Promise<string[]> {
    const features: string[] = [];

    if (await this.fileExists(path.join(projectPath, 'composer.json'))) {
      features.push('composer');
    }
    if (await this.fileExists(path.join(projectPath, 'phpunit.xml'))) {
      features.push('phpunit');
    }
    if (await this.fileExists(path.join(projectPath, '.env'))) {
      features.push('env-config');
    }

    return features;
  }

  private async detectPython(projectPath: string): Promise<ProjectType> {
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const pipfilePath = path.join(projectPath, 'Pipfile');
    const poetryPath = path.join(projectPath, 'pyproject.toml');

    if (await this.fileExists(requirementsPath)) {
      const content = await fs.promises.readFile(requirementsPath, 'utf-8');
      return this.analyzeRequirementsTxt(content, projectPath);
    }

    if (await this.fileExists(pipfilePath)) {
      const content = await fs.promises.readFile(pipfilePath, 'utf-8');
      return this.analyzePipfile(content, projectPath);
    }

    if (await this.fileExists(poetryPath)) {
      const content = await fs.promises.readFile(poetryPath, 'utf-8');
      return this.analyzePoetryFile(content, projectPath);
    }

    const hasPyFiles = await this.hasFilesWithExtension(projectPath, '.py');
    if (hasPyFiles) {
      const framework = await this.detectPythonFramework(projectPath);
      return {
        type: 'python',
        framework: framework || 'Python',
        features: [],
      };
    }

    return { type: 'unknown', features: [] };
  }

  private async analyzeRequirementsTxt(content: string, projectPath: string): Promise<ProjectType> {
    const lines = content.toLowerCase().split('\n');
    const features: string[] = [];
    let framework = 'Python';
    let version: string | undefined;

    for (const line of lines) {
      if (line.includes('django')) {
        framework = 'Django';
        const match = line.match(/django[>=<]*(\d+\.\d+)/);
        if (match) version = match[1];
        features.push('django');
      } else if (line.includes('flask')) {
        framework = 'Flask';
        const match = line.match(/flask[>=<]*(\d+\.\d+)/);
        if (match) version = match[1];
        features.push('flask');
      } else if (line.includes('fastapi')) {
        framework = 'FastAPI';
        const match = line.match(/fastapi[>=<]*(\d+\.\d+)/);
        if (match) version = match[1];
        features.push('fastapi');
      }

      if (line.includes('pytest')) features.push('pytest');
      if (line.includes('sqlalchemy')) features.push('sqlalchemy');
      if (line.includes('celery')) features.push('celery');
    }

    return {
      type: 'python',
      framework,
      version,
      features,
    };
  }

  private async analyzePipfile(content: string, projectPath: string): Promise<ProjectType> {
    const features: string[] = ['pipenv'];
    let framework = 'Python';
    let version: string | undefined;

    if (content.toLowerCase().includes('django')) {
      framework = 'Django';
      features.push('django');
    } else if (content.toLowerCase().includes('flask')) {
      framework = 'Flask';
      features.push('flask');
    } else if (content.toLowerCase().includes('fastapi')) {
      framework = 'FastAPI';
      features.push('fastapi');
    }

    return {
      type: 'python',
      framework,
      version,
      features,
    };
  }

  private async analyzePoetryFile(content: string, projectPath: string): Promise<ProjectType> {
    const features: string[] = ['poetry'];
    let framework = 'Python';
    let version: string | undefined;

    if (content.toLowerCase().includes('django')) {
      framework = 'Django';
      features.push('django');
    } else if (content.toLowerCase().includes('flask')) {
      framework = 'Flask';
      features.push('flask');
    } else if (content.toLowerCase().includes('fastapi')) {
      framework = 'FastAPI';
      features.push('fastapi');
    }

    return {
      type: 'python',
      framework,
      version,
      features,
    };
  }

  private async detectPythonFramework(projectPath: string): Promise<string | undefined> {
    if (await this.fileExists(path.join(projectPath, 'manage.py'))) {
      return 'Django';
    }
    if (await this.fileExists(path.join(projectPath, 'app.py'))) {
      const content = await fs.promises.readFile(
        path.join(projectPath, 'app.py'),
        'utf-8'
      ).catch(() => '');

      if (content.includes('Flask')) return 'Flask';
      if (content.includes('FastAPI')) return 'FastAPI';
    }

    return undefined;
  }

  private async hasFilesWithExtension(dirPath: string, extension: string): Promise<boolean> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(extension)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
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
