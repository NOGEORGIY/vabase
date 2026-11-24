export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_color: string;
}

export interface DemoAccount {
  role: string;
  title: string;
  email: string;
  password: string;
  description: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface ProjectStats {
  assistants: number;
  entities: number;
  services: number;
  components: number;
  prompts: number;
  tools: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  stats: ProjectStats;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  service_type: string;
  status: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Component {
  id: string;
  name: string;
  description: string;
  component_type: string;
  status: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntityItem {
  id: string;
  name: string;
  description: string;
  fields_count: number;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  topics: string;
  tools: string;
  task: string;
  status: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptSearchHit {
  prompt: Prompt;
  score: number;
  matched_terms: string[];
}

export interface PromptSearchResponse {
  query: string;
  items: PromptSearchHit[];
}

export interface PromptElement {
  id: string;
  name: string;
  description: string;
  element_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PromptTask {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PromptVariable {
  id: string;
  name: string;
  description: string;
  value_type: string;
  default_value: string;
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input_text: string;
  expected_output: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  tool_type: string;
  endpoint: string;
  http_method: string;
  version: string;
  status: string;
  requires_approval: boolean;
  input_schema: Record<string, unknown>;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolCheck {
  id: string;
  label: string;
  status: "ok" | "warning" | "error";
  message: string;
}

export interface ToolValidation {
  valid: boolean;
  checks: ToolCheck[];
  tool: Tool;
}

export interface ToolSearchHit {
  tool: Tool;
  score: number;
  matched_terms: string[];
}

export interface InfoCategory {
  id: string;
  name: string;
  description: string;
  characteristics_count: number;
  created_at: string;
  updated_at: string;
}

export interface Characteristic {
  id: string;
  name: string;
  description: string;
  category_id: string | null;
  data_type: string;
  required: boolean;
  category_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scale {
  id: string;
  name: string;
  description: string;
  scale_type: string;
  created_at: string;
  updated_at: string;
}

export interface InfoValue {
  id: string;
  name: string;
  description: string;
  scale_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterpretedValue {
  id: string;
  name: string;
  description: string;
  raw_value: string;
  created_at: string;
  updated_at: string;
}

export interface Constraint {
  id: string;
  name: string;
  description: string;
  expression: string;
  created_at: string;
  updated_at: string;
}

export interface DictionaryItem {
  id: string;
  name: string;
  description: string;
  dict_type: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Library {
  id: string;
  name: string;
  description: string;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryClass {
  id: string;
  name: string;
  description: string;
  library_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricsSummary {
  projects: number;
  services: number;
  components: number;
  prompts: number;
  tools: number;
  published_tools: number;
  dictionaries: number;
  runs: number;
  success_rate: number;
  avg_duration_ms: number;
  tokens_spent: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "ready" | "planned";
  footprint: string;
}

export interface AgentRoadmap {
  module: string;
  status: string;
  title: string;
  summary: string;
  items: RoadmapItem[];
  endpoints: string[];
  data_model: string[];
  ready_building_blocks: string[];
}

export interface SearchItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
}

export interface SearchGroup {
  type: string;
  title: string;
  items: SearchItem[];
}

export interface SearchResponse {
  query: string;
  total: number;
  groups: SearchGroup[];
}
