"use client";

import { useState } from "react";

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  onCreateCollection: (collectionData: CollectionFormData) => void;
  loading: boolean;
}

interface CollectionFormData {
  title: string;
  handle: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  type: "Manual" | "Smart";
  published: boolean;
  conditions: string;
}

export default function CreateCollectionModal({
  open,
  onClose,
  onCreateCollection,
  loading,
}: CreateCollectionModalProps) {
  const [formData, setFormData] = useState<CollectionFormData>({
    title: "",
    handle: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    type: "Manual",
    published: true,
    conditions: "",
  });

  const [errors, setErrors] = useState<Partial<CollectionFormData>>({});

  const handleInputChange = (field: keyof CollectionFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      handle: prev.handle || generateHandle(value)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CollectionFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Collection title is required";
    }

    if (!formData.handle.trim()) {
      newErrors.handle = "Handle is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.handle)) {
      newErrors.handle = "Handle can only contain lowercase letters, numbers, and hyphens";
    }

    if (formData.type === "Smart" && !formData.conditions.trim()) {
      newErrors.conditions = "Conditions are required for smart collections";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onCreateCollection(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      handle: "",
      description: "",
      seoTitle: "",
      seoDescription: "",
      type: "Manual",
      published: true,
      conditions: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <s-modal open={open} onClose={handleClose} title="Create New Collection">
      <form onSubmit={handleSubmit}>
        <s-stack direction="block" gap="large" padding="large">
          {/* Basic Information */}
          <s-box
            padding="base"
            background="subdued"
            border="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="base">
              <s-text type="strong">Basic Information</s-text>
              
              <s-stack direction="block" gap="small">
                <s-text type="strong">Collection Title *</s-text>
                <s-textfield
                  value={formData.title}
                  onInput={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter collection title"
                  error={errors.title}
                />
              </s-stack>

              <s-stack direction="block" gap="small">
                <s-text type="strong">Handle *</s-text>
                <s-textfield
                  value={formData.handle}
                  onInput={(e) => handleInputChange("handle", e.target.value)}
                  placeholder="collection-handle"
                  error={errors.handle}
                />
                <s-text color="subdued" size="small">
                  URL-friendly version of the title (auto-generated from title)
                </s-text>
              </s-stack>

              <s-stack direction="block" gap="small">
                <s-text type="strong">Description</s-text>
                <s-textarea
                  value={formData.description}
                  onInput={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter collection description"
                  rows={3}
                />
              </s-stack>
            </s-stack>
          </s-box>

          {/* Collection Type */}
          <s-box
            padding="base"
            background="subdued"
            border="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="base">
              <s-text type="strong">Collection Type</s-text>
              
              <s-stack direction="block" gap="small">
                <s-radio-group
                  value={formData.type}
                  onChange={(value) => handleInputChange("type", value)}
                >
                  <s-radio value="Manual">Manual Collection</s-radio>
                  <s-radio value="Smart">Smart Collection</s-radio>
                </s-radio-group>
              </s-stack>

              {formData.type === "Smart" && (
                <s-stack direction="block" gap="small">
                  <s-text type="strong">Conditions *</s-text>
                  <s-textarea
                    value={formData.conditions}
                    onInput={(e) => handleInputChange("conditions", e.target.value)}
                    placeholder="e.g., product_type equals T-Shirt, tag contains summer"
                    rows={3}
                    error={errors.conditions}
                  />
                  <s-text color="subdued" size="small">
                    Define rules for automatic product inclusion
                  </s-text>
                </s-stack>
              )}
            </s-stack>
          </s-box>

          {/* SEO Settings */}
          <s-box
            padding="base"
            background="subdued"
            border="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="base">
              <s-text type="strong">SEO Settings</s-text>
              
              <s-stack direction="block" gap="small">
                <s-text type="strong">SEO Title</s-text>
                <s-textfield
                  value={formData.seoTitle}
                  onInput={(e) => handleInputChange("seoTitle", e.target.value)}
                  placeholder="Search engine optimized title"
                />
              </s-stack>

              <s-stack direction="block" gap="small">
                <s-text type="strong">SEO Description</s-text>
                <s-textarea
                  value={formData.seoDescription}
                  onInput={(e) => handleInputChange("seoDescription", e.target.value)}
                  placeholder="Meta description for search engines"
                  rows={2}
                />
              </s-stack>
            </s-stack>
          </s-box>

          {/* Publishing */}
          <s-box
            padding="base"
            background="subdued"
            border="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="base">
              <s-text type="strong">Publishing</s-text>
              
              <s-checkbox
                checked={formData.published}
                onChecked={(checked) => handleInputChange("published", checked)}
              >
                <s-text>Make this collection visible to customers</s-text>
              </s-checkbox>
            </s-stack>
          </s-box>

          {/* Actions */}
          <s-box
            padding="base"
            background="base"
            border="base"
            borderRadius="base"
          >
            <s-button-group>
              <s-button
                slot="primary-action"
                variant="primary"
                type="submit"
                loading={loading}
                disabled={loading}
              >
                Create Collection
              </s-button>
              <s-button
                slot="secondary-actions"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </s-button>
            </s-button-group>
          </s-box>
        </s-stack>
      </form>
    </s-modal>
  );
}
