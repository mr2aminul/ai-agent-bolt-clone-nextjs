import supabase from './client';
import type {
  User,
  Project,
  Chat,
  Message,
  Task,
  File,
  Workplan,
  Metrics,
  SearchResult,
  Agent,
  Dependency,
} from './types';

export const userQueries = {
  async get(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as User | null;
  },

  async create(email: string, name?: string) {
    const { data, error } = await supabase
      .from('users')
      .insert({ email, name })
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },
};

export const projectQueries = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Project[];
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Project | null;
  },

  async create(userId: string, name: string, description?: string, path?: string) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name, description, path })
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  async update(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  async delete(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },
};

export const chatQueries = {
  async list(projectId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Chat[];
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Chat | null;
  },

  async create(projectId: string, title?: string) {
    const { data, error } = await supabase
      .from('chats')
      .insert({ project_id: projectId, title })
      .select()
      .single();
    if (error) throw error;
    return data as Chat;
  },

  async delete(id: string) {
    const { error } = await supabase.from('chats').delete().eq('id', id);
    if (error) throw error;
  },
};

export const messageQueries = {
  async list(chatId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data as Message[]).reverse();
  },

  async create(chatId: string, role: 'user' | 'assistant' | 'system', content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, role, content })
      .select()
      .single();
    if (error) throw error;
    return data as Message;
  },
};

export const taskQueries = {
  async list(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('priority', { ascending: true });
    if (error) throw error;
    return data as Task[];
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Task | null;
  },

  async create(projectId: string, title: string, description?: string, priority?: number) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ project_id: projectId, title, description, priority })
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  },

  async update(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  },

  async delete(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
};

export const fileQueries = {
  async list(projectId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('path', { ascending: true });
    if (error) throw error;
    return data as File[];
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as File | null;
  },

  async create(
    projectId: string,
    path: string,
    content?: string,
    size?: number,
    fileType?: string
  ) {
    const { data, error } = await supabase
      .from('files')
      .insert({ project_id: projectId, path, content, size, file_type: fileType })
      .select()
      .single();
    if (error) throw error;
    return data as File;
  },

  async update(id: string, updates: Partial<File>) {
    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as File;
  },

  async delete(id: string) {
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) throw error;
  },
};

export const workplanQueries = {
  async list(projectId: string) {
    const { data, error } = await supabase
      .from('workplans')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Workplan[];
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('workplans')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Workplan | null;
  },

  async create(projectId: string, title: string, description?: string) {
    const { data, error } = await supabase
      .from('workplans')
      .insert({ project_id: projectId, title, description })
      .select()
      .single();
    if (error) throw error;
    return data as Workplan;
  },

  async update(id: string, updates: Partial<Workplan>) {
    const { data, error } = await supabase
      .from('workplans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Workplan;
  },
};

export const metricsQueries = {
  async get(projectId: string) {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    if (error) throw error;
    return data as Metrics | null;
  },

  async createOrUpdate(projectId: string, updates: Partial<Metrics>) {
    const existing = await metricsQueries.get(projectId);

    if (existing) {
      const { data, error } = await supabase
        .from('metrics')
        .update(updates)
        .eq('project_id', projectId)
        .select()
        .single();
      if (error) throw error;
      return data as Metrics;
    }

    const { data, error } = await supabase
      .from('metrics')
      .insert({ project_id: projectId, ...updates })
      .select()
      .single();
    if (error) throw error;
    return data as Metrics;
  },
};

export const searchResultQueries = {
  async get(query: string, projectId?: string) {
    let q = supabase.from('search_results').select('*').eq('query', query);

    if (projectId) {
      q = q.eq('project_id', projectId);
    }

    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data as SearchResult | null;
  },

  async create(query: string, results: unknown, projectId?: string) {
    const { data, error } = await supabase
      .from('search_results')
      .insert({ query, results, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return data as SearchResult;
  },
};

export const agentQueries = {
  async list() {
    const { data, error } = await supabase.from('agents').select('*');
    if (error) throw error;
    return data as Agent[];
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Agent | null;
  },

  async create(name: string, type: string, capabilities?: unknown) {
    const { data, error } = await supabase
      .from('agents')
      .insert({ name, type, capabilities })
      .select()
      .single();
    if (error) throw error;
    return data as Agent;
  },

  async update(id: string, updates: Partial<Agent>) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Agent;
  },
};

export const dependencyQueries = {
  async list(projectId: string) {
    const { data, error } = await supabase
      .from('dependencies')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data as Dependency[];
  },

  async create(
    projectId: string,
    name: string,
    type: 'npm' | 'pip' | 'composer' | 'system',
    version?: string
  ) {
    const { data, error } = await supabase
      .from('dependencies')
      .insert({ project_id: projectId, name, type, version })
      .select()
      .single();
    if (error) throw error;
    return data as Dependency;
  },

  async delete(id: string) {
    const { error } = await supabase.from('dependencies').delete().eq('id', id);
    if (error) throw error;
  },
};
