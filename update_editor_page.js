const fs = require('fs');
const path = 'c:/Projects/Eventorav2/app/(app)/editor/page.tsx';

let content = fs.readFileSync(path, 'utf8');

const handlers = `  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

  const removeImage = (index: number) => {
    setAttachedImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      setSaveStatus("saving")
      try {
        await fetch("/api/editor/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitationId: currentInvitation.id,
            pages: pages.map(({ id, name, content }) => ({ id, name, content })),
          }),
        })
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch {
        setSaveStatus("error")
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [pages, currentInvitation.id])

`;

const splitPoint = '  const handleSendMessage = async () => {';
if (content.includes(splitPoint)) {
  content = content.replace(splitPoint, handlers + splitPoint);
} else {
  console.error('Target line not found');
  process.exit(1);
}

// Update handleSendMessage body
content = content.replace(
  'const prompt = inputValue.trim()',
  'const prompt = inputValue.trim()\n    const hasImages = attachedImages.length > 0'
);

content = content.replace(
  'if (!prompt || isTyping)',
  'if (!prompt && !hasImages || isTyping)'
);

content = content.replace(
  'content: prompt',
  'content: prompt,\n        images: hasImages ? attachedImages.map(img => img.preview) : undefined'
);

fs.writeFileSync(path, content);
console.log('File updated successfully');
