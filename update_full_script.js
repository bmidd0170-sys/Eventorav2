const fs = require('fs');
const path = 'C:/Projects/Eventorav2/app/(app)/editor/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. In handleSendMessage, add gallery logic
// The previous attempt show \r\n ($ in cat -A suggests CRLF)
const beforeTryMatch = /setIsTyping\(true\)\s+try \{/;
const galleryLogic = `setIsTyping(true)
    let nextPages = pages
    let nextActivePage = activePage
    const hasImages = attachedImages.length > 0
    
    if (hasImages) {
      const galleryPageId = pages.find(p => p.id.startsWith('gallery'))?.id
      if (!galleryPageId) {
        const newGalleryPage: InvitePage = {
          id: \`gallery-\${Date.now()}\`,
          name: "Photo Gallery",
          icon: ImageIcon,
          content: {
            headline: "Gallery",
            images: attachedImages.map(img => img.preview),
          }
        }
        nextPages = [...pages, newGalleryPage]
        nextActivePage = newGalleryPage.id
      } else {
        nextPages = nextPages.map(p =>
          p.id === galleryPageId
            ? {
              ...p,
              content: {
                ...p.content,
                images: [...(p.content.images || []), ...attachedImages.map(img => img.preview)],
              }
            }
            : p
        )
      }
    }

    try {`;

if (beforeTryMatch.test(content)) {
    content = content.replace(beforeTryMatch, galleryLogic);
} else {
    console.error('Target beforeTry not found via regex');
    process.exit(1);
}

// 2. Update fetch /api/editor/ai body
content = content.replace('activePage,', 'activePage: nextActivePage,');

// Handle pages: pages.map line carefully - the regex might be more robust
const pagesMapRegex = /pages: pages\.map\(([^)]+)\) => \(([^)]+)\)\),/;
const pagesMapReplacement = 'pages: nextPages.map($1) => ($2)),\n          images: hasImages ? attachedImages.map(img => ({ name: img.name, data: img.preview, type: \'base64\' })) : undefined,';
if (pagesMapRegex.test(content)) {
  content = content.replace(pagesMapRegex, pagesMapReplacement);
} else {
   console.error('pagesMapRegex not found');
   // process.exit(1); // Don't exit yet, see if others pass
}

// 3. Update applyAiActions call
content = content.replace('applyAiActions(data.actions, pages)', 'applyAiActions(data.actions, nextPages)');

// 4. Add cleanup and update if(didMutate)
const assistantMessageEnd = 'setMessages(prev => [...prev, assistantMessage])';
const cleanup = `setMessages(prev => [...prev, assistantMessage])
      attachedImages.forEach((img) => URL.revokeObjectURL(img.preview))
      setAttachedImages([])`;
content = content.replace(assistantMessageEnd, cleanup);
content = content.replace('if (didMutate)', 'if (hasImages || didMutate)');

// 5. Add Gallery Images Grid in InvitePagePreview
const buttonsMarker = /<div className="flex gap-2 pt-8">/;
const galleryGrid = `          {/* Gallery Images */}
          {content.images && content.images.length > 0 && (
            <div className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                {content.images.map((imageSrc: string, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border/30">
                    <img
                      src={imageSrc}
                      alt={\`Gallery image \${index + 1}\`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          `;
if (buttonsMarker.test(content)) {
    content = content.replace(buttonsMarker, (match) => galleryGrid + match);
} else {
    console.error('buttonsMarker not found');
    process.exit(1);
}

fs.writeFileSync(path, content);
console.log('File updated successfully');
