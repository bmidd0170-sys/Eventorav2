"use client"

import React from "react"
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type InvitePage = {
  id: string
  name: string
  icon: React.ElementType
  content: any
}

export default function PagesSortable({
  pages,
  setPages,
  activePage,
  setActivePage,
  removePage,
}: {
  pages: InvitePage[]
  setPages: (fn: (p: InvitePage[]) => InvitePage[] | InvitePage[]) => void
  activePage: string
  setActivePage: (id: string) => void
  removePage: (id: string) => void
}) {
  const ids = pages.map((p) => p.id)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const activeDragItem = pages.find((p) => p.id === activeId)

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        setActiveId(event.active.id as string)
      }}
      onDragEnd={(event) => {
        const { active, over } = event
        setActiveId(null)
        if (!over) return
        if (active.id !== over.id) {
          const oldIndex = pages.findIndex((p) => p.id === active.id)
          const newIndex = pages.findIndex((p) => p.id === over.id)
          setPages((prev: InvitePage[]) => arrayMove(prev, oldIndex, newIndex))
        }
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pages.map((page, index) => (
            <SortableItem
              key={page.id}
              page={page}
              index={index}
              activePage={activePage}
              setActivePage={setActivePage}
              removePage={removePage}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeDragItem ? (
          <PageDragOverlay page={activeDragItem} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function PageDragOverlay({ page }: { page: InvitePage }) {
  const Icon = page.icon as React.ElementType

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 border border-primary/40 shadow-lg">
      <GripVertical className="w-4 h-4 text-primary" />
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-xs font-medium text-primary">{page.name}</span>
    </div>
  )
}

function SortableItem({
  page,
  index,
  activePage,
  setActivePage,
  removePage,
}: {
  page: InvitePage
  index: number
  activePage: string
  setActivePage: (id: string) => void
  removePage: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties

  const Icon = page.icon as React.ElementType

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
        isDragging
          ? "opacity-50 bg-muted/50"
          : isOver
            ? "bg-primary/15 border border-primary/30"
            : activePage === page.id
              ? "bg-primary/20 text-foreground"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
      }`}
      onClick={() => setActivePage(page.id)}
      {...attributes}
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-primary/10 rounded transition-colors"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground" />
      </div>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-xs truncate">{page.name}</span>
      <span className="text-[10px] text-muted-foreground">{index + 1}</span>

      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  )
}
