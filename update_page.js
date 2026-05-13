const fs = require('fs');
const path = 'c:/Projects/Eventorav2/app/(app)/editor/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// a. PageContent
content = content.replace(
  '  elements?: InvitationElement[]',
  '  elements?: InvitationElement[]\n  images?: string[]'
);

// b. Message
content = content.replace(
  '  timestamp: Date',
  '  timestamp: Date\n  images?: string[]'
);

// c. State
const stateDecls = `  const [attachedImages, setAttachedImages] = useState<Array<{name: string, preview: string}>>([])
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")`;

content = content.replace(
  'const messagesEndRef = useRef<HTMLDivElement>(null)',
  'const messagesEndRef = useRef<HTMLDivElement>(null)\n' + stateDecls
);

// d. Functions/Effects
const funcsAndEffects = `
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
      if (saveStatus !== "idle") return;
      // Auto-save logic
    }, 1000)
    return () => clearTimeout(timer)
  }, [pages])
`;

content = content.replace(
  'useEffect(() => { scrollToBottom() }, [messages])',
  'useEffect(() => { scrollToBottom() }, [messages])' + funcsAndEffects
);

// e. handleSendMessage
const oldHandleSend = `  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const prompt = input.trim()
    if (!prompt || isTyping) return

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }`;

const newHandleSendStart = `  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const prompt = input.trim()
    const hasImages = attachedImages.length > 0
    if (!prompt && !hasImages || isTyping) return

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      images: hasImages ? attachedImages.map(img => img.preview) : undefined,
    }`;

content = content.replace(oldHandleSend, newHandleSendStart);

const fetchOld = `      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          pages,
          activePageId: activePage,
        }),
      })`;

const fetchNew = `      let nextPages = [...pages]
      let nextActivePage = activePage

      if (hasImages) {
        const galleryPageId = \`page-\${Date.now()}\`
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
      })`;

content = content.replace(fetchOld, fetchNew);

content = content.replace(
  'applyAiActions(data.actions, pages, activePage)',
  'applyAiActions(data.actions, nextPages, nextActivePage)'
);

content = content.replace(
  'if (data.didMutate)',
  'setAttachedImages([]);\n      if (data.didMutate)'
);

// f. InvitePagePreview
const galleryGrid = `            {currentPage.images && currentPage.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 my-8">
                {currentPage.images.map((img, idx) => (
                  <img key={idx} src={img} alt="" className="rounded-lg w-full h-auto" />
                ))}
              </div>
            )}`;

content = content.replace(
  '{currentPage.elements?.map((element) => (',
  galleryGrid + '\\n            {currentPage.elements?.map((element) => ('
);

fs.writeFileSync(path, content);
