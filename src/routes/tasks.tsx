import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { Button, Dialog, Input } from '#/components/storybook'
import { useRequireAuth } from '../auth/use-auth-redirect'
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '../../generated/api-types'

import type { CreateTask, Task, UpdateTask } from '../../generated/api-types'

export const Route = createFileRoute('/tasks')({ component: Tasks })

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
})

function Tasks() {
  const { isLoading, isAuthenticated } = useRequireAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const queryClient = useQueryClient()

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await listTasks()
      if (res.status === 200) return res.data
      throw new Error('Failed to load tasks')
    },
    enabled: isAuthenticated,
  })

  const createTaskMutation = useMutation({
    mutationFn: async (input: CreateTask) => {
      const res = await createTask(input)
      if (res.status === 201) return res.data
      throw new Error('Failed to create task')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setIsCreating(false)
      form.reset()
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTask }) => {
      const res = await updateTask(id, input)
      if (res.status === 200) return res.data
      throw new Error('Failed to update task')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditingTask(null)
      form.reset()
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTask(id)
      if (res.status === 204) return
      throw new Error('Failed to delete task')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const form = useForm({
    defaultValues: {
      title: editingTask?.title ?? '',
      description: editingTask?.description ?? '',
    },
    validators: { onSubmit: taskFormSchema },
    onSubmit: ({ value }) => {
      const input = {
        title: value.title,
        description: value.description || null,
      }
      if (editingTask) {
        updateTaskMutation.mutate({ id: editingTask.id, input })
      } else {
        createTaskMutation.mutate(input)
      }
    },
  })

  const openCreateModal = () => {
    form.reset({ title: '', description: '' })
    setIsCreating(true)
  }

  const openEditModal = (task: Task) => {
    form.reset({ title: task.title, description: task.description })
    setEditingTask(task)
  }

  const closeModal = () => {
    form.reset({ title: '', description: '' })
    setIsCreating(false)
    setEditingTask(null)
  }

  const isModalOpen = isCreating || editingTask !== null
  const activeMutation = editingTask ? updateTaskMutation : createTaskMutation

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Tasks</h1>
        <Button onClick={openCreateModal}>New Task</Button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <Dialog
            title={editingTask ? 'Edit Task' : 'Create Task'}
            className="w-full max-w-sm"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void form.handleSubmit()
              }}
              className="flex flex-col gap-4"
            >
              <form.Field name="title">
                {(field) => (
                  <Input
                    id={field.name}
                    label="Title"
                    required
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    error={field.state.meta.errors[0]?.message}
                  />
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <Input
                    id={field.name}
                    label="Description"
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    error={field.state.meta.errors[0]?.message}
                  />
                )}
              </form.Field>

              {activeMutation.isError && (
                <p className="text-sm text-red-500">
                  {activeMutation.error.message}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={activeMutation.isPending}>
                  {activeMutation.isPending
                    ? editingTask
                      ? 'Saving…'
                      : 'Creating…'
                    : editingTask
                      ? 'Save'
                      : 'Create'}
                </Button>
              </div>
            </form>
          </Dialog>
        </div>
      )}

      {tasksQuery.isPending ? (
        <p className="mt-4 text-lg">Loading tasks…</p>
      ) : tasksQuery.isError ? (
        <p className="mt-4 text-lg">Could not load tasks.</p>
      ) : tasksQuery.data.length === 0 ? (
        <p className="mt-4 text-lg">No tasks yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {tasksQuery.data.map((task) => (
            <li
              key={task.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <h2 className="text-xl font-semibold">{task.title}</h2>
                {task.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => openEditModal(task)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  disabled={
                    deleteTaskMutation.isPending &&
                    deleteTaskMutation.variables === task.id
                  }
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
