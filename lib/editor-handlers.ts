// Image and auto-save handlers for the editor

export function createHandleDrop(
  setAttachedImages: (fn: (prev: Array<{name: string, preview: string}>) => Array<{name: string, preview: string}>) => void,
  setIsDraggingImages: (val: boolean) => void
) {
  return (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingImages(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const preview = event.target?.result as string
        setAttachedImages(prev => [...prev, { name: file.name, preview }])
      }
      reader.readAsDataURL(file)
    })
  }
}

export function createRemoveImage(
  setAttachedImages: (fn: (prev: Array<{name: string, preview: string}>) => Array<{name: string, preview: string}>) => void
) {
  return (index: number) => {
    setAttachedImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }
}
