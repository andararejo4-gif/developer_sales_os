import React from 'react';
import { Building2 } from 'lucide-react';

export interface ProjectOption {
  id: string;
  slug: string;
  name: string;
  total_units: number;
}

interface ProjectSwitcherProps {
  projects: ProjectOption[];
  currentProjectId: string;
  onSelectProject: (projectId: string) => void;
  userRole: string;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  userRole
}) => {
  // Aturan Bagian 3: Pengguna dengan satu proyek tidak melihat pengalih
  const isMultiProjectUser = userRole === 'DEVELOPER_OWNER' || userRole === 'DIREKSI' || projects.length > 1;

  if (!isMultiProjectUser && projects.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sandstone border border-warmborder text-xs font-semibold text-espresso">
        <Building2 className="size-3.5 text-terracotta" />
        <span className="truncate max-w-[180px]">{projects[0]?.name || 'The Park Townhouse'}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-warmmuted hidden sm:inline">Proyek:</span>
        <select
          value={currentProjectId}
          onChange={e => onSelectProject(e.target.value)}
          className="h-8 pl-2 pr-6 rounded-lg bg-sandstone hover:bg-white border border-warmborder text-xs font-bold text-espresso cursor-pointer focus:border-terracotta focus:outline-none transition-colors"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.total_units} Unit)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
