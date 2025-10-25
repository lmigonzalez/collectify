"use client";

import { Collection, CollectionField } from "../../types/collections";

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  collections: Collection[];
  availableFields: CollectionField[];
  selectedCollections: string[];
  selectedFields: string[];
  onCollectionSelection: (collectionId: string, checked: boolean) => void;
  onFieldSelection: (fieldId: string, checked: boolean) => void;
  onSelectAllCollections: () => void;
  onDeselectAllCollections: () => void;
  onSelectAllFields: () => void;
  onDeselectAllFields: () => void;
  onGenerateCSV: () => void;
}

export default function DownloadModal({
  open,
  onClose,
  collections,
  availableFields,
  selectedCollections,
  selectedFields,
  onCollectionSelection,
  onFieldSelection,
  onSelectAllCollections,
  onDeselectAllCollections,
  onSelectAllFields,
  onDeselectAllFields,
  onGenerateCSV,
}: DownloadModalProps) {
  return (
    <s-modal open={open} onClose={onClose} title="Download Collections">
      <s-stack direction="block" gap="large" padding="large">
        {/* Collection Selection */}
        <s-box
          padding="base"
          background="subdued"
          border="base"
          borderRadius="base"
        >
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-text type="strong">Select Collections</s-text>
              <s-button-group>
                <s-button
                  slot="primary-action"
                  variant="secondary"
                  size="small"
                  onClick={onSelectAllCollections}
                >
                  Select All
                </s-button>
                <s-button
                  slot="secondary-actions"
                  variant="secondary"
                  size="small"
                  onClick={onDeselectAllCollections}
                >
                  Deselect All
                </s-button>
              </s-button-group>
            </s-stack>
            
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="small">
              {collections.map((collection) => (
                <s-checkbox
                  key={collection.id}
                  checked={selectedCollections.includes(collection.id)}
                  onChecked={(checked) => onCollectionSelection(collection.id, checked)}
                >
                  <s-stack direction="block" gap="small">
                    <s-text type="strong">{collection.title}</s-text>
                    <s-text color="subdued" size="small">
                      {collection.type} • {collection.productCount} products
                    </s-text>
                  </s-stack>
                </s-checkbox>
              ))}
            </s-grid>
          </s-stack>
        </s-box>

        {/* Field Selection */}
        <s-box
          padding="base"
          background="subdued"
          border="base"
          borderRadius="base"
        >
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-text type="strong">Select Fields</s-text>
              <s-button-group>
                <s-button
                  slot="primary-action"
                  variant="secondary"
                  size="small"
                  onClick={onSelectAllFields}
                >
                  Select All
                </s-button>
                <s-button
                  slot="secondary-actions"
                  variant="secondary"
                  size="small"
                  onClick={onDeselectAllFields}
                >
                  Deselect All
                </s-button>
              </s-button-group>
            </s-stack>
            
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="small">
              {availableFields.map((field) => (
                <s-checkbox
                  key={field.id}
                  checked={selectedFields.includes(field.id)}
                  onChecked={(checked) => onFieldSelection(field.id, checked)}
                >
                  <s-stack direction="block" gap="small">
                    <s-text type="strong">{field.label}</s-text>
                    <s-text color="subdued" size="small">
                      {field.description}
                    </s-text>
                  </s-stack>
                </s-checkbox>
              ))}
            </s-grid>
          </s-stack>
        </s-box>

        {/* Download Actions */}
        <s-box
          padding="base"
          background="base"
          border="base"
          borderRadius="base"
        >
          <s-stack direction="block" gap="base">
            <s-text type="strong">Download Summary</s-text>
            <s-text color="subdued">
              {selectedCollections.length} collection{selectedCollections.length !== 1 ? 's' : ''} selected • 
              {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
            </s-text>
            
            <s-button-group>
              <s-button
                slot="primary-action"
                variant="primary"
                onClick={onGenerateCSV}
                disabled={selectedCollections.length === 0 || selectedFields.length === 0}
                icon="download"
              >
                Download CSV
              </s-button>
              <s-button
                slot="secondary-actions"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </s-button>
            </s-button-group>
          </s-stack>
        </s-box>
      </s-stack>
    </s-modal>
  );
}
