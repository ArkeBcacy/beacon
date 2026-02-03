# Label Serialization with Nested Hierarchy

Labels in Contentstack can have a hierarchical structure where labels can be nested under parent labels. This implementation supports serializing and deserializing nested label structures.

## Structure

Labels are stored in `schema/labels.yaml` with a hierarchical structure:

```yaml
labels:
  - uid: component
    name: Component
    children:
      - uid: calculator
        name: Calculator
      - uid: data
        name: Data
      - uid: page
        name: Page
```

## Implementation

The label serialization/deserialization uses the same pattern as taxonomies:

1. **Pull (toFilesystem)**: Fetches flat labels from Contentstack API and organizes them into a hierarchical tree structure based on `parent_uid` relationships.

2. **Push (toContentstack)**: Reads the hierarchical structure from `labels.yaml`, flattens it back to include `parent_uid` fields, and syncs with Contentstack.

## Example: Component Labels

The screenshot shows a typical use case:

- **Component** (parent label)
  - Calculator (child)
  - Data (child)
  - Page (child)

This serializes as:

```yaml
labels:
  - uid: component
    name: Component
    children:
      - uid: calculator
        name: Calculator
      - uid: data
        name: Data
      - uid: page
        name: Page
```

And pushes to Contentstack as:

- `{ uid: 'component', name: 'Component', parent_uid: null }`
- `{ uid: 'calculator', name: 'Calculator', parent_uid: 'component' }`
- `{ uid: 'data', name: 'Data', parent_uid: 'component' }`
- `{ uid: 'page', name: 'Page', parent_uid: 'component' }`

## Backwards Compatibility

The implementation maintains backwards compatibility with flat label arrays:

```yaml
labels:
  - uid: label1
    name: Label 1
  - uid: label2
    name: Label 2
```

This flat structure is automatically converted to the hierarchical format during pull operations.
