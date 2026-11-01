export interface ServiceOrdersBreadcrumbItem {
  label: string;
  /** Ausente no nível atual. */
  href?: string;
}

export interface ServiceOrdersBreadcrumbProps {
  items: ServiceOrdersBreadcrumbItem[];
}
