# AI Development Rules

This document outlines the tech stack and coding conventions for this project to ensure consistency and maintainability.

## Tech Stack

*   **Framework:** React with Vite for a fast development experience.
*   **Language:** TypeScript for type safety and improved developer experience.
*   **Styling:** Tailwind CSS for all styling. All styles should be applied via utility classes.
*   **Icons:** `lucide-react` is the designated library for all icons.
*   **Mapping:** `react-leaflet` and `leaflet` are used for interactive maps.
*   **Geocoding:** OpenStreetMap's Nominatim API is used for geocoding.
*   **State Management:** Local state is managed with React Hooks (`useState`, `useEffect`). Global state is managed through prop drilling from the main `App.tsx` component.
*   **Linting:** ESLint is configured to maintain code quality.

## Library and Component Usage

*   **Styling:** Exclusively use Tailwind CSS utility classes. Do not write custom CSS files or use inline `style` attributes unless absolutely necessary for dynamic properties that cannot be handled by Tailwind.
*   **Icons:** When an icon is needed, import it from `lucide-react`.
*   **UI Components:**
    *   For standard form elements (inputs, selects, text areas), use the existing components: `FormField`, `SelectField`, and `TextAreaField`.
    *   For more complex UI elements like dialogs, dropdowns, etc., use components from the `shadcn/ui` library.
    *   New components should be created as single-responsibility files within the `src/components` directory.
*   **Mapping:** All map functionality should be built using `react-leaflet`. The `MapSection.tsx` component serves as a primary example.
*   **State Management:** For simple, local state, use React Hooks. For state that needs to be shared across multiple components, lift the state up to the nearest common ancestor component (e.g., `App.tsx`). Avoid introducing complex state management libraries like Redux or Zustand unless the application's complexity demands it.
*   **File Structure:**
    *   Reusable components go into `src/components/`.
    *   Type definitions are located in `src/types/`.
    *   Utility functions (like validation, geocoding) are in `src/utils/`.