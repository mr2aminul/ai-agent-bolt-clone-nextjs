export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  project_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: number;
  agent_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: string;
  project_id: string;
  path: string;
  content: string | null;
  size: number;
  file_type: string | null;
  last_modified: string;
  created_at: string;
}

export interface Workplan {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Metrics {
  id: string;
  project_id: string;
  files_count: number;
  lines_of_code: number;
  test_coverage: number;
  complexity_score: number;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  project_id: string | null;
  query: string;
  results: unknown;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'active' | 'error';
  capabilities: unknown;
  created_at: string;
  updated_at: string;
}

export interface Dependency {
  id: string;
  project_id: string;
  name: string;
  version: string | null;
  type: 'npm' | 'pip' | 'composer' | 'system';
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      chats: {
        Row: Chat;
        Insert: Omit<Chat, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Chat, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'timestamp'>;
        Update: Partial<Omit<Message, 'id' | 'timestamp'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      files: {
        Row: File;
        Insert: Omit<File, 'id' | 'created_at'>;
        Update: Partial<Omit<File, 'id' | 'created_at'>>;
      };
      workplans: {
        Row: Workplan;
        Insert: Omit<Workplan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Workplan, 'id' | 'created_at'>>;
      };
      metrics: {
        Row: Metrics;
        Insert: Omit<Metrics, 'id' | 'updated_at'>;
        Update: Partial<Omit<Metrics, 'id'>>;
      };
      search_results: {
        Row: SearchResult;
        Insert: Omit<SearchResult, 'id' | 'timestamp'>;
        Update: Partial<Omit<SearchResult, 'id' | 'timestamp'>>;
      };
      agents: {
        Row: Agent;
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Agent, 'id' | 'created_at'>>;
      };
      dependencies: {
        Row: Dependency;
        Insert: Omit<Dependency, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Dependency, 'id' | 'created_at'>>;
      };
    };
  };
}
