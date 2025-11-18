/*
  # Code Entities Storage for AST Analysis

  1. New Tables
    - `code_entities` - Stores parsed code entities (functions, classes, methods, properties)
      - Links to files for tracking code structure
      - Stores entity metadata (type, location, params, visibility)
      - Enables intelligent code understanding and editing

  2. Security
    - Enable RLS to ensure entities are only accessible by project owners
    - Policies check ownership through files -> projects -> users

  3. Indexes
    - file_id for fast entity lookups per file
    - entity_type for filtering by type
    - name for searching entities by name
    - parent_class for finding class members

  4. Features
    - Track all code entities with line/column precision
    - Store function parameters and return types
    - Track class hierarchies and relationships
    - Support multiple languages (JavaScript, TypeScript, PHP)
*/

-- Code entities table
CREATE TABLE IF NOT EXISTS code_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('function', 'class', 'method', 'property', 'interface', 'type')),
  language text NOT NULL CHECK (language IN ('javascript', 'typescript', 'php')),
  start_line integer NOT NULL,
  end_line integer NOT NULL,
  start_column integer NOT NULL,
  end_column integer NOT NULL,
  params jsonb DEFAULT '[]'::jsonb,
  return_type text,
  is_async boolean DEFAULT false,
  is_exported boolean DEFAULT false,
  parent_class text,
  visibility text CHECK (visibility IN ('public', 'private', 'protected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE code_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read project code entities"
  ON code_entities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = code_entities.file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create code entities"
  ON code_entities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update code entities"
  ON code_entities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = code_entities.file_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete code entities"
  ON code_entities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = code_entities.file_id
      AND projects.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_code_entities_file_id ON code_entities(file_id);
CREATE INDEX idx_code_entities_type ON code_entities(entity_type);
CREATE INDEX idx_code_entities_name ON code_entities(name);
CREATE INDEX idx_code_entities_parent_class ON code_entities(parent_class) WHERE parent_class IS NOT NULL;
CREATE INDEX idx_code_entities_language ON code_entities(language);

-- Import/Export tracking table
CREATE TABLE IF NOT EXISTS code_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  source text NOT NULL,
  imports jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  is_namespace boolean DEFAULT false,
  line integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read project code imports"
  ON code_imports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = code_imports.file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create code imports"
  ON code_imports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete code imports"
  ON code_imports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = code_imports.file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE INDEX idx_code_imports_file_id ON code_imports(file_id);
CREATE INDEX idx_code_imports_source ON code_imports(source);

-- Export tracking table
CREATE TABLE IF NOT EXISTS code_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  line integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read project code exports"
  ON code_exports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = code_exports.file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create code exports"
  ON code_exports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete code exports"
  ON code_exports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE files.id = code_exports.file_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE INDEX idx_code_exports_file_id ON code_exports(file_id);
CREATE INDEX idx_code_exports_name ON code_exports(name);
