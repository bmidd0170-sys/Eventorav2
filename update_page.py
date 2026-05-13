import os

path = r'c:/Projects/Eventorav2/app/(app)/editor/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# a. In type PageContent, after elements?: InvitationElement[], add images?: string[]
content = content.replace(
    '  elements?: InvitationElement[]',
    '  elements?: InvitationElement[]\n  images?: string[]'
)

# b. In type Message, after timestamp: Date, add images?: string[]
content = content.replace(
    '  timestamp: Date',
    '  timestamp: Date\n  images?: string[]'
)

# c. After const messagesEndRef = useRef<HTMLDivElement>(null), add state declarations
state_decls = """  const [attachedImages, setAttachedImages] = useState<Array<{name: string, preview: string}>>([])
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")"""

content = content.replace(
    'const messagesEndRef = useRef<HTMLDivElement>(null)',
    'const messagesEndRef = useRef<HTMLDivElement>(null)\n' + state_decls
)

# d. After the useEffect(() => { scrollToBottom() }, [messages]) effect, add helper functions and autosave
funcs_and_effects = """
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingImages(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    const newImages = await Promise.all(
      files.map(file => new Promise<{name: string, preview: string}>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve({ name: file.name, preview: reader.result as string })
        reader.readAsDataURL(file)
      }))
    )
    setAttachedImages(prev => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setAttachedImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (saveStatus !== "idle") return; // Simplified logic for demo
      // Auto-save logic placeholder
    }, 1000)
    return () => clearTimeout(timer)
  }, [pages])
"""

content = content.replace(
    'useEffect(() => { scrollToBottom() }, [messages])',
    'useEffect(() => { scrollToBottom() }, [messages])\n' + funcs_and_effects
)

# e. Update handleSendMessage
# Finding the start of handleSendMessage
old_handle_send = """  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const prompt = input.trim()
    if (!prompt || isTyping) return

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }"""

new_handle_send_start = """  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const prompt = input.trim()
    const hasImages = attachedImages.length > 0
    if (!prompt && !hasImages || isTyping) return

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      images: hasImages ? attachedImages.map(img => img.preview) : undefined,
    }"""

content = content.replace(old_handle_send, new_handle_send_start)

# Add gallery page creation logic and update fetch
# This is tricky because the block is large. I will look for specific markers.

fetch_block_old = """      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          pages,
          activePageId: activePage,
        }),
      })"""

fetch_block_new = """      let nextPages = [...pages]
      let nextActivePage = activePage

      if (hasImages) {
        const galleryPageId = `page-${Date.now()}`
        const galleryPage: PageContent = {
          id: galleryPageId,
          name: 'Gallery',
          elements: [],
          images: attachedImages.map(img => img.preview)
        }
        nextPages.push(galleryPage)
        nextActivePage = galleryPageId
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          pages: nextPages,
          activePageId: nextActivePage,
          images: hasImages ? attachedImages.map(img => img.preview) : undefined
        }),
      })"""

content = content.replace(fetch_block_old, fetch_block_new)

# Update applyAiActions and cleanup
content = content.replace(
    'applyAiActions(data.actions, pages, activePage)',
    'applyAiActions(data.actions, nextPages, nextActivePage)'
)

content = content.replace(
    'if (data.didMutate)',
    'setAttachedImages([]);\n      if (data.didMutate)'
)

# f. In InvitePagePreview, add gallery images grid
gallery_grid = """            {currentPage.images && currentPage.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 my-8">
                {currentPage.images.map((img, idx) => (
                  <img key={idx} src={img} alt="" className="rounded-lg w-full h-auto" />
                ))}
              </div>
            )}"""

# We look for where the elements are rendered in InvitePagePreview
content = content.replace(
    '{currentPage.elements?.map((element) => (',
    gallery_grid + '\n            {currentPage.elements?.map((element) => ('
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
