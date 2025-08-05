import React from 'react';
import { Plus, FolderOpen, Users, Zap, TrendingUp, ChevronsRight, Sun, MapPin, Trash2 } from 'lucide-react';
import { ProjectData } from '../types/project';

interface DashboardHomeProps {
  onCreateProject: () => void;
  projects: ProjectData[];
  onSelectProject: (project: ProjectData) => void;
  onDeleteProject: (projectId: string) => void;
  isLoading: boolean;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onCreateProject, projects, onSelectProject, onDeleteProject, isLoading }) => {
  const totalProjects = projects.length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-8 text-white mb-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Welcome to HelioScope</h1>
          <p className="text-orange-100 text-lg mb-6">
            Design and optimize solar projects with precision. Start by creating your first project.
          </p>
          <button
            onClick={onCreateProject}
            className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 
                       transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">0 kW</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Growth</p>
              <p className="text-2xl font-bold text-gray-900">+0%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first solar project.</p>
              <button
                onClick={onCreateProject}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 
                           transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-grow">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Sun className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex-grow">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); onSelectProject(project); }}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {project.projectName}
                      </a>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1.5" />
                        {project.address}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
                    <div className="text-sm text-gray-600 hidden sm:block">
                      <span className="font-medium text-gray-800">{project.projectType}</span>
                    </div>
                    <div className="text-sm text-gray-500 hidden md:block">
                      Created on {new Date(project.created_at!).toLocaleDateString()}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id!); }}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-500 hover:text-red-700"
                      title="Delete Project"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => onSelectProject(project)} className="p-2 rounded-lg hover:bg-gray-200">
                      <ChevronsRight className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;