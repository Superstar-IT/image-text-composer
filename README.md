# Image Text Composer - Coding Assignment

A desktop-only, single-page image editing tool that enables users to upload a PNG image and overlay it with fully customizable text. Built with Next.js, TypeScript, and Fabric.js.

<div align="center">
<a href="https://image-text-composer-two.vercel.app/">View Demo</a>
<span>
</div>

## Features

### Core Requirements ✅
- **PNG Image Upload**: Upload background images with automatic canvas sizing and intelligent resizing for large images
- **Multiple Text Layers**: Add, edit, and manage multiple text layers independently
- **Text Styling**: Full control over font family, size, weight, color, opacity, and alignment
- **Multi-line Text**: Support for multiple lines within the same text box
- **Transform Controls**: Drag, resize with handles, and rotate text layers
- **Layer Management**: Reorder layers with up/down controls
- **Canvas UX**: Snap-to-center functionality and arrow key nudging
- **Undo/Redo**: 20-step history with visual indicator
- **Autosave**: Automatic localStorage persistence with debounced saving, visual indicators, and restoration on page refresh
- **Reset Functionality**: Clear saved design and return to blank state
- **PNG Export**: Export final design with original image dimensions

### Bonus Features ✅
- **Text Shadow**: Customizable color and blur controls (offset controls disabled due to Fabric.js clipping group bug)
- **Line Height & Letter Spacing**: Fine-tune text spacing
- **Layer Locking**: Lock/unlock layers to prevent accidental editing
- **Layer Visibility**: Show/hide layers with eye icon
- **Layer Duplication**: Copy existing text layers with a single click (planned feature)
- **Google Fonts Integration**: 30+ Google Fonts with proper weight support
- **Keyboard Shortcuts**: Arrow keys for nudging, Delete for removal
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Autosave Indicators**: Visual feedback for save status and last save time
- **Restore Notifications**: Automatic notification when design is restored from previous session
- **Large Image Handling**: Automatic resizing of oversized images with quality preservation
- **Error Handling**: Robust error handling for image loading and storage issues
- **Scrollable Canvas**: Support for large images with scrollable canvas container

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Canvas Library**: Fabric.js for robust canvas interactions
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts API integration
- **State Management**: React hooks with custom history management
- **Storage**: Browser localStorage for autosave functionality

## Architecture

### Component Structure
```
app/
├── page.tsx                 # Main application component
├── layout.tsx              # Root layout with font loading
└── globals.css             # Global styles and Tailwind

components/
├── Canvas.tsx              # Fabric.js canvas wrapper with scrollable container
├── Toolbar.tsx             # Main toolbar with actions
├── LayersPanel.tsx         # Layer management panel
└── PropertiesPanel.tsx     # Text layer properties editor

utils/
├── canvas.ts               # Fabric.js utility functions with image resizing
├── fonts.ts                # Google Fonts configuration
├── history.ts              # Undo/redo functionality
└── storage.ts              # localStorage operations with error handling

types/
└── index.ts                # TypeScript type definitions
```

### State Management
The application uses a custom history management system with:
- **CanvasState**: Current canvas state including background image and layers
- **HistoryState**: Past, present, and future states for undo/redo
- **Autosave**: Automatic localStorage persistence on state changes
- **Layer Management**: Individual layer properties and selection state
- **Error Handling**: Background image error states and user notifications

### Key Design Decisions

1. **Fabric.js Choice**: Selected for its mature canvas manipulation capabilities, excellent text handling, and robust transformation controls.

2. **TypeScript**: Ensures type safety and better developer experience for complex canvas operations.

3. **Component Architecture**: Modular design with clear separation of concerns between canvas operations, UI components, and state management.

4. **Responsive Design**: Desktop-first approach with intuitive panel layout optimized for large screens.

5. **Performance**: Efficient state updates with proper memoization and minimal re-renders.

6. **Autosave Strategy**: Debounced saving with visual feedback to prevent excessive localStorage writes while providing user confidence.

7. **Large Image Strategy**: Automatic resizing with aspect ratio preservation and quality optimization to handle images of any size.

8. **Error Handling**: Comprehensive error handling for image loading failures, storage quota issues, and React hydration mismatches.

## Setup and Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Superstar-IT/image-text-composer.git
cd image-text-composer

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Setup

Create a `.env.local` file in the root directory with the following configuration:

```bash
# Google Fonts API (Optional - for additional font loading)
NEXT_PUBLIC_GOOGLE_FONTS_API_KEY="your_google_fonts_api_key_here"
```

#### Environment Variables Explained:

- **`NEXT_PUBLIC_GOOGLE_FONTS_API_KEY`**: Optional Google Fonts API key for enhanced font loading

#### Google Fonts API Key (Optional):

If you want to use the Google Fonts API for additional font loading:

1. Go to [Google Fonts API](https://developers.google.com/fonts/docs/css2)
2. Get your API key from the Google Cloud Console
3. Add it to your `.env.local` file

**Note**: The application works without the Google Fonts API key as it uses a predefined list of fonts.

#### Environment File Locations:

- **Development**: `.env.local` (gitignored)
- **Production**: Set environment variables in your hosting platform (Vercel, Netlify, etc.)

#### Troubleshooting:

**Common Issues:**
- **"Environment variable not found"**: Ensure `.env.local` is in the root directory
- **"Google Fonts not loading"**: Check if your API key is valid (optional feature)

**File Structure Check:**
```
image-text-composer/
├── .env.local          # Your environment file (create this)
├── .gitignore          # Should include .env.local
├── package.json
├── next.config.js
└── ...
```


### Build for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Usage

1. **Upload Image**: Click "Upload Image" to select a PNG file
   - Large images (>1920x1080) are automatically resized while preserving quality
   - Images over 5MB are optimized for storage
2. **Add Text**: Click "Add Text" to create a new text layer
3. **Edit Properties**: Select a layer and use the Properties panel to customize:
   - Text content and alignment
   - Font family, size, and weight
   - Color and opacity
   - Line height and letter spacing
   - Text shadow effects
4. **Transform**: Drag, resize, or rotate text layers directly on canvas
5. **Layer Management**: Use the Layers panel to reorder, lock, hide, or duplicate layers
6. **Export**: Click "Export" to download the final PNG image

## Large Image Handling

The application intelligently handles images of any size:

### Automatic Resizing
- **Maximum dimensions**: 1920x1080 pixels (Full HD)
- **Aspect ratio preservation**: Images maintain their original proportions
- **Quality optimization**: High-quality resizing using HTML5 Canvas
- **File size management**: Automatic compression for images over 5MB

### User Experience
- **Scrollable canvas**: Large images can be scrolled within the viewport
- **Visual feedback**: Console logging shows resizing details
- **Error handling**: Graceful fallback if image processing fails
- **Performance**: Optimized for smooth operation with large images

## Keyboard Shortcuts

- **Arrow Keys**: Nudge selected layer (hold Shift for larger steps)
- **Delete/Backspace**: Remove selected layer
- **Ctrl+Z / Cmd+Z**: Undo
- **Ctrl+Y / Cmd+Y**: Redo
- **Ctrl+Shift+Z / Cmd+Shift+Z**: Redo (alternative)

## Error Handling

The application includes comprehensive error handling:

### Image Loading Errors
- **Invalid image formats**: Clear error messages for unsupported files
- **Corrupted images**: Graceful handling of damaged image files
- **Loading failures**: Automatic retry and fallback mechanisms

### Storage Errors
- **localStorage quota exceeded**: Automatic cleanup and retry
- **Data corruption**: Validation and recovery of stored data
- **Browser compatibility**: Fallback for unsupported storage features

### React Hydration
- **SSR/CSR mismatch**: Proper client-side only operations for localStorage
- **State synchronization**: Consistent state between server and client renders

## Known Limitations

1. **Desktop Only**: Mobile/touch interactions not supported
2. **PNG Only**: Limited to PNG format for import/export
3. **Browser Storage**: Autosave limited to browser localStorage capacity
4. **Font Loading**: Google Fonts require internet connection
5. **Image Size**: Very large images (>10MB) may still cause performance issues
6. **Text Shadow Offset**: Offset controls disabled due to Fabric.js clipping group bug that causes background image loss
7. **Fabric.js Version**: Some advanced features limited by current Fabric.js version constraints

## Technical Decisions

### Text Shadow Implementation
The text shadow feature includes color and blur controls, but offset controls (X/Y positioning) are intentionally disabled due to a known Fabric.js bug [(#9527)](https://github.com/fabricjs/fabric.js/issues/9527) that causes background images to disappear when using shadow offsets with clipping groups. This is a limitation of the current Fabric.js version and affects the clipping group implementation used for text boundaries.

### Layer Management
The application uses a clipping group approach for text layers to maintain proper boundaries and prevent text overflow. This design choice provides better text containment but has some limitations with certain Fabric.js features like shadow offsets.

### Future Enhancements
- **Text Shadow Offset**: Re-enable offset controls when Fabric.js bug is resolved
- **Custom font upload support**
- **Multi-select with group transforms**
- **Smart spacing hints**
- **Warp/curved text along paths**
- **Collaboration features**
- **Additional export formats**
- **Mobile responsiveness**
- **Advanced image filters and effects**
- **Template system for common designs**
- **Cloud storage integration**

## Performance Considerations

- Efficient state management with proper memoization
- Debounced autosave (1-second delay) to prevent excessive localStorage writes
- Visual autosave indicators to provide user feedback
- Optimized canvas rendering with Fabric.js
- Lazy loading of Google Fonts
- Minimal re-renders through proper React patterns
- Error handling for localStorage quota exceeded scenarios
- Intelligent image resizing to prevent memory issues
- Scrollable canvas container for large images
- Quality optimization for storage efficiency