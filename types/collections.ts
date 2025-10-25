export interface Collection {
  id: string;
  title: string;
  handle: string;
  productCount: number;
  type: "Manual" | "Smart";
  published: boolean;
  description: string;
  seoTitle: string;
  seoDescription: string;
  conditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionField {
  id: string;
  label: string;
  description: string;
}
