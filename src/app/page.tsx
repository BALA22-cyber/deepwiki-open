'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FaWikipediaW, FaGithub, FaGitlab, FaBitbucket, FaCoffee, FaTwitter } from 'react-icons/fa';
import ThemeToggle from '@/components/theme-toggle';
import Mermaid from '../components/Mermaid';

// Define the demo mermaid charts outside the component
const DEMO_FLOW_CHART = `graph TD
  A[Code Repository] --> B[DeepWiki]
  B --> C[Architecture Diagrams]
  B --> D[Component Relationships]
  B --> E[Data Flow]
  B --> F[Process Workflows]

  style A fill:#f9d3a9,stroke:#d86c1f
  style B fill:#d4a9f9,stroke:#6c1fd8
  style C fill:#a9f9d3,stroke:#1fd86c
  style D fill:#a9d3f9,stroke:#1f6cd8
  style E fill:#f9a9d3,stroke:#d81f6c
  style F fill:#d3f9a9,stroke:#6cd81f`;

const DEMO_SEQUENCE_CHART = `sequenceDiagram
  participant User
  participant DeepWiki
  participant GitHub

  User->>DeepWiki: Enter repository URL
  DeepWiki->>GitHub: Request repository data
  GitHub-->>DeepWiki: Return repository data
  DeepWiki->>DeepWiki: Process and analyze code
  DeepWiki-->>User: Display wiki with diagrams

  %% Add a note to make text more visible
  Note over User,GitHub: DeepWiki supports sequence diagrams for visualizing interactions`;

// Add custom type for file input element
interface HTMLInputEvent extends Event {
  target: HTMLInputElement & {
    files: FileList;
  };
}

// Extend HTMLInputElement to include webkitdirectory
interface CustomFileInput extends HTMLInputElement {
  webkitdirectory: boolean;
  directory: string;
}

export default function Home() {
  const router = useRouter();
  const [repositoryInput, setRepositoryInput] = useState('https://github.com/AsyncFuncAI/deepwiki-open');
  const [showTokenInputs, setShowTokenInputs] = useState(false);
  const [localOllama, setLocalOllama] = useState(false);
  const [useOpenRouter, setUseOpenRouter] = useState(false);
  const [openRouterModel, setOpenRouterModel] = useState('openai/gpt-4o');
  const [selectedPlatform, setSelectedPlatform] = useState<'github' | 'gitlab' | 'bitbucket'>('github');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocalRepo, setIsLocalRepo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseRepositoryInput = (input: string): { owner: string, repo: string, type: string, fullPath?: string } | null => {
    input = input.trim();

    // Handle local repository path
    if (isLocalRepo) {
      const parts = input.split('/');
      const repo = parts[parts.length - 1];
      return {
        owner: 'local',
        repo: repo,
        type: 'local',
        fullPath: input
      };
    }

    let owner = '', repo = '', type = 'github', fullPath;

    // Handle GitHub URL format
    if (input.startsWith('https://github.com/')) {
      type = 'github';
      const parts = input.replace('https://github.com/', '').split('/');
      owner = parts[0] || '';
      repo = parts[1] || '';
    }
    // Handle GitLab URL format
    else if (input.startsWith('https://gitlab.com/')) {
      type = 'gitlab';
      const parts = input.replace('https://gitlab.com/', '').split('/');
      if (parts.length >= 2) {
        repo = parts[parts.length - 1] || '';
        owner = parts[0] || '';
        fullPath = parts.join('/');
      }
    }
    // Handle Bitbucket URL format
    else if (input.startsWith('https://bitbucket.org/')) {
      type = 'bitbucket';
      const parts = input.replace('https://bitbucket.org/', '').split('/');
      owner = parts[0] || '';
      repo = parts[1] || '';
    }
    // Handle owner/repo format (assume GitHub by default)
    else {
      const parts = input.split('/');
      owner = parts[0] || '';
      repo = parts[1] || '';
    }

    // Clean values
    owner = owner.trim();
    repo = repo.trim();
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    if (!owner || !repo) {
      return null;
    }

    return { owner, repo, type, fullPath };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const parsedRepo = parseRepositoryInput(repositoryInput);

    if (!parsedRepo) {
      setError('Invalid repository format. Please provide a valid repository path or URL.');
      setIsSubmitting(false);
      return;
    }

    const { owner, repo, type, fullPath } = parsedRepo;
    const params = new URLSearchParams();
    
    if (showTokenInputs && accessToken) {
      if (type === 'github') params.append('github_token', accessToken);
      else if (type === 'gitlab') params.append('gitlab_token', accessToken);
      else if (type === 'bitbucket') params.append('bitbucket_token', accessToken);
    }

    params.append('type', type);
    if (localOllama) params.append('local_ollama', 'true');
    if (useOpenRouter) {
      params.append('use_openrouter', 'true');
      params.append('openrouter_model', openRouterModel);
    }

    router.push(`/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}?${params.toString()}`);
  };

  return (
    <div className="h-screen paper-texture p-4 md:p-8 flex flex-col">
      <header className="max-w-6xl mx-auto mb-6 h-fit w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[var(--card-bg)] rounded-lg shadow-custom border border-[var(--border-color)] p-4">
          <div className="flex items-center">
            <div className="bg-[var(--accent-primary)] p-2 rounded-lg mr-3">
              <FaWikipediaW className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--accent-primary)]">DeepWiki</h1>
              <p className="text-xs text-[var(--muted)]">Generate Wiki from Code</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 w-full max-w-3xl">
            {/* Repository Source Options */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Repository Source
              </label>
              <div className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => setIsLocalRepo(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    !isLocalRepo
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Remote
                </button>
                <button
                  type="button"
                  onClick={() => setIsLocalRepo(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    isLocalRepo
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Local
                </button>
              </div>
            </div>

            {/* Repository Input Section */}
            {isLocalRepo ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Local Repository Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repositoryInput}
                    onChange={(e) => setRepositoryInput(e.target.value)}
                    placeholder="Enter local repository path"
                    className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Browse
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    // @ts-ignore
                    webkitdirectory="true"
                    // @ts-ignore
                    directory=""
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const relPath = e.target.files[0].webkitRelativePath;
                        const dirName = relPath.split('/')[0];
                        setRepositoryInput(dirName);
                      }
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The Browse function only works for local development (when the backend can access your filesystem).
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repository URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repositoryInput}
                    onChange={(e) => setRepositoryInput(e.target.value)}
                    placeholder="Enter repository URL or owner/repo"
                    className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenInputs(!showTokenInputs)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {showTokenInputs ? 'Hide Token' : 'Add Token'}
                  </button>
                </div>
              </div>
            )}

            {/* Model Selection Options */}
            <div className="flex flex-col gap-2 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model Options</h3>
              
              {/* Local Ollama Option */}
              <div className="flex items-center">
                <input
                  id="local-ollama"
                  type="checkbox"
                  checked={localOllama}
                  onChange={(e) => {
                    setLocalOllama(e.target.checked);
                    if (e.target.checked) {
                      setUseOpenRouter(false);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="local-ollama" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Use Local Ollama (No API key needed)
                </label>
              </div>

              {/* OpenRouter Option */}
              <div className="flex items-center">
                <input
                  id="use-openrouter"
                  type="checkbox"
                  checked={useOpenRouter}
                  onChange={(e) => {
                    setUseOpenRouter(e.target.checked);
                    if (e.target.checked) {
                      setLocalOllama(false);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="use-openrouter" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Use OpenRouter API
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Generate Wiki'}
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto overflow-y-auto">
        <div className="h-full overflow-y-auto flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <FaWikipediaW className="text-5xl text-purple-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Welcome to DeepWiki (Open Source)</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            Enter a GitHub, GitLab, Bitbucket repository, or local repository path to generate a comprehensive wiki.
          </p>

          <div className="w-full max-w-md mt-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Now with Mermaid Diagram Support!</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              DeepWiki supports both flow diagrams and sequence diagrams to help visualize:
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Flow Diagram Example:</h4>
              <Mermaid chart={DEMO_FLOW_CHART} />
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sequence Diagram Example:</h4>
              <Mermaid chart={DEMO_SEQUENCE_CHART} />
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-8 flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center gap-4 text-center text-gray-500 dark:text-gray-400 text-sm h-fit w-full">
          <p className="flex-1">DeepWiki - Generate Wiki from GitHub/GitLab/Bitbucket repositories</p>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}