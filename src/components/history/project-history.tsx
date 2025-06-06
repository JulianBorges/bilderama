'use client'

import { useState, useEffect } from 'react'
import { Clock, Star, Trash2 } from 'lucide-react'

type Project = {
  id: string
  title: string
  prompt: string
  code: string
  createdAt: string
  isFavorite: boolean
}

export function ProjectHistory() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const savedProjects = localStorage.getItem('bilderama-projects')
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects))
    }
  }, [])

  const toggleFavorite = (id: string) => {
    const updatedProjects = projects.map((project) =>
      project.id === id
        ? { ...project, isFavorite: !project.isFavorite }
        : project
    )
    setProjects(updatedProjects)
    localStorage.setItem('bilderama-projects', JSON.stringify(updatedProjects))
  }

  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter((project) => project.id !== id)
    setProjects(updatedProjects)
    localStorage.setItem('bilderama-projects', JSON.stringify(updatedProjects))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-2xl font-bold">Histórico de Projetos</h2>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum projeto salvo ainda. Crie seu primeiro projeto!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{project.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(project.id)}
                    className={`rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      project.isFavorite ? 'text-yellow-500' : ''
                    }`}
                    title={
                      project.isFavorite
                        ? 'Remover dos favoritos'
                        : 'Adicionar aos favoritos'
                    }
                  >
                    <Star className="h-4 w-4" fill={project.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="rounded-lg p-1 text-destructive hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Excluir projeto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {project.prompt}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(project.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 