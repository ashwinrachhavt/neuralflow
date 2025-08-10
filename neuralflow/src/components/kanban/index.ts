/**
 * Kanban Board Components
 * 
 * A complete drag-and-drop Kanban board implementation with:
 * - Smooth animations using Framer Motion
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Responsive design with Tailwind CSS
 * - Integration with @dnd-kit for drag and drop
 * - Debounced state updates to prevent excessive writes
 */

export { default as Board } from './Board';
export { default as Column } from './Column';
export { default as TaskCard } from './TaskCard';