export type SearchResultType = 'WORKSPACE' | 'PROJECT' | 'TASK' | 'USER';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  route: string;
  workspaceId?: string;
  projectId?: string;
}
