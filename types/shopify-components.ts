import React from "react";

// Type declarations for Shopify web components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "s-page": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        heading?: string;
      };
      "s-layout": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-layout-section": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-card": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-paragraph": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-drop-zone": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        accessibilityLabel?: string;
        accept?: string;
        onInput?: (e: React.FormEvent<HTMLElement>) => void;
        onChange?: (e: React.FormEvent<HTMLElement>) => void;
        onDropRejected?: (e: React.FormEvent<HTMLElement>) => void;
      };
      "s-banner": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        tone?: "critical" | "info" | "success" | "warning";
        title?: string;
      };
      "s-button": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
      > & {
        variant?: "primary" | "secondary" | "tertiary";
        slot?: "primary-action" | "secondary-actions";
        disabled?: boolean;
        onClick?: () => void;
      };
      "s-text": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: "headingMd" | "bodyMd" | "bodySm";
        as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
        color?: "base" | "subdued";
        tone?: "success" | "critical" | "warning" | "info";
        type?: "strong" | "subdued" | "code";
      };
      "s-stack": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        gap?: "tight" | "loose" | "extraLoose";
        vertical?: boolean;
        direction?: "row" | "column";
        accessibilityLabel?: string;
        padding?: "tight" | "loose" | "extraLoose";
      };
      "s-table": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-table-head": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-table-body": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-table-row": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-table-header-cell": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-table-cell": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-spinner": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        size?: "small" | "large";
      };
      "s-checkbox": React.DetailedHTMLProps<
        React.InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
      > & {
        checked?: boolean;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      };
      "s-divider": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "s-choice-list": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        name?: string;
        onChange?: (event: { currentTarget: { values: string[] } }) => void;
      };
      "s-choice": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value: string;
        selected?: boolean;
      };
      "s-select": React.DetailedHTMLProps<
        React.SelectHTMLAttributes<HTMLSelectElement>,
        HTMLSelectElement
      > & {
        label?: string;
        value?: string;
        onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
      };
      "s-option": React.DetailedHTMLProps<
        React.OptionHTMLAttributes<HTMLOptionElement>,
        HTMLOptionElement
      > & {
        value: string;
      };
      "s-text-field": React.DetailedHTMLProps<
        React.InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
      > & {
        label?: string;
        value?: string;
        placeholder?: string;
        onInput?: (event: React.FormEvent<HTMLInputElement>) => void;
      };
      "s-text-area": React.DetailedHTMLProps<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        HTMLTextAreaElement
      > & {
        label?: string;
        value?: string;
        placeholder?: string;
        rows?: number;
        onInput?: (event: React.FormEvent<HTMLTextAreaElement>) => void;
      };
      "s-section": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        padding?: "base" | "large" | "small";
      };
    }
  }
}
