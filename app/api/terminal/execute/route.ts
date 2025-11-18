import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface ExecuteRequest {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

const ALLOWED_COMMANDS = [
  'npm', 'node', 'npx',
  'php', 'composer',
  'python', 'python3', 'pip', 'pip3',
  'git',
  'ls', 'dir', 'cat', 'echo', 'pwd', 'cd',
];

function isCommandAllowed(command: string): boolean {
  const cmd = command.trim().split(' ')[0];
  return ALLOWED_COMMANDS.includes(cmd);
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();
    const { command, cwd, env } = body;

    if (!command || !command.trim()) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    if (!isCommandAllowed(command)) {
      return NextResponse.json(
        { error: 'Command not allowed for security reasons' },
        { status: 403 }
      );
    }

    const workingDir = cwd ? path.resolve(cwd) : process.cwd();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const parts = command.trim().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        const childProcess = spawn(cmd, args, {
          cwd: workingDir,
          env: { ...process.env, ...env },
          shell: true,
        });

        childProcess.stdout.on('data', (data) => {
          const output = data.toString();
          const message = JSON.stringify({ type: 'stdout', data: output });
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        });

        childProcess.stderr.on('data', (data) => {
          const output = data.toString();
          const message = JSON.stringify({ type: 'stderr', data: output });
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        });

        childProcess.on('error', (error) => {
          const message = JSON.stringify({
            type: 'error',
            data: `Error: ${error.message}`,
          });
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          controller.close();
        });

        childProcess.on('close', (code) => {
          const message = JSON.stringify({
            type: 'exit',
            code,
            data: `Process exited with code ${code}`,
          });
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    );
  }
}
