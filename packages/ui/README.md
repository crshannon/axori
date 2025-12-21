# @axori/ui - Design System

Shared component library for the Axori application.

## Usage

```tsx
import { Button, Card, Input } from "@axori/ui";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello</CardTitle>
      </CardHeader>
      <CardContent>
        <Input label="Name" />
        <Button variant="primary">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

- **Button** - Primary action button with variants and sizes
- **Card** - Container component with header, content, and footer
- **Input** - Text input with label and error handling
- **Select** - Dropdown select with options
- **Text** - Typography component
- **Badge** - Status indicator
- **Loading** - Spinner component
- **Modal** - Dialog/modal component

## Utilities

- **cn()** - Merge Tailwind classes with conflict resolution

