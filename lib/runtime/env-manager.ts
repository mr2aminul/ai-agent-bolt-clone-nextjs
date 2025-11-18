import * as fs from 'fs';
import * as path from 'path';

export interface EnvVariable {
  key: string;
  value: string;
  comment?: string;
}

export class EnvManager {
  async readEnvFile(projectPath: string): Promise<EnvVariable[]> {
    const envPath = path.join(projectPath, '.env');

    try {
      const content = await fs.promises.readFile(envPath, 'utf-8');
      return this.parseEnvContent(content);
    } catch (error) {
      return [];
    }
  }

  parseEnvContent(content: string): EnvVariable[] {
    const variables: EnvVariable[] = [];
    const lines = content.split('\n');
    let currentComment: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('#')) {
        currentComment = trimmed.slice(1).trim();
        continue;
      }

      if (!trimmed || !trimmed.includes('=')) {
        currentComment = undefined;
        continue;
      }

      const equalIndex = trimmed.indexOf('=');
      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      variables.push({
        key,
        value,
        comment: currentComment,
      });

      currentComment = undefined;
    }

    return variables;
  }

  async writeEnvFile(projectPath: string, variables: EnvVariable[]): Promise<void> {
    const envPath = path.join(projectPath, '.env');
    const lines: string[] = [];

    for (const variable of variables) {
      if (variable.comment) {
        lines.push(`# ${variable.comment}`);
      }

      const needsQuotes = variable.value.includes(' ') ||
                         variable.value.includes('#') ||
                         variable.value.includes('\n');

      if (needsQuotes) {
        lines.push(`${variable.key}="${variable.value}"`);
      } else {
        lines.push(`${variable.key}=${variable.value}`);
      }
    }

    const content = lines.join('\n') + '\n';
    await fs.promises.writeFile(envPath, content, 'utf-8');
  }

  async updateEnvVariable(
    projectPath: string,
    key: string,
    value: string,
    comment?: string
  ): Promise<void> {
    const variables = await this.readEnvFile(projectPath);
    const existingIndex = variables.findIndex((v) => v.key === key);

    if (existingIndex !== -1) {
      variables[existingIndex] = { key, value, comment };
    } else {
      variables.push({ key, value, comment });
    }

    await this.writeEnvFile(projectPath, variables);
  }

  async deleteEnvVariable(projectPath: string, key: string): Promise<void> {
    const variables = await this.readEnvFile(projectPath);
    const filtered = variables.filter((v) => v.key !== key);
    await this.writeEnvFile(projectPath, filtered);
  }

  async createEnvExample(projectPath: string): Promise<void> {
    const variables = await this.readEnvFile(projectPath);
    const examplePath = path.join(projectPath, '.env.example');

    const exampleVariables = variables.map((v) => ({
      key: v.key,
      value: '',
      comment: v.comment || `Set your ${v.key}`,
    }));

    const lines: string[] = [];
    for (const variable of exampleVariables) {
      if (variable.comment) {
        lines.push(`# ${variable.comment}`);
      }
      lines.push(`${variable.key}=`);
    }

    const content = lines.join('\n') + '\n';
    await fs.promises.writeFile(examplePath, content, 'utf-8');
  }

  validateEnvVariables(required: string[], variables: EnvVariable[]): {
    valid: boolean;
    missing: string[];
  } {
    const existingKeys = new Set(variables.map((v) => v.key));
    const missing = required.filter((key) => !existingKeys.has(key));

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

export const envManager = new EnvManager();
