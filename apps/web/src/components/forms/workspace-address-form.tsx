"use client"

import type { FormConfig } from "@/lib/form-builder"
import type { CreateWorkspaceAddressBody } from "@/lib/api-client/types.gen"

export type WorkspaceAddressFormValues = CreateWorkspaceAddressBody

export const workspaceAddressFormDefaults: WorkspaceAddressFormValues = {
  name: "",
  building: "",
  street_1: "",
  street_2: "",
  city: "Galle",
  state: "",
  postal_code: "",
  country: "Sri Lanka",
}

export const workspaceAddressFormConfig: FormConfig<WorkspaceAddressFormValues> = {
  fields: [
    { name: "name", kind: "text", label: "Label", required: true, placeholder: "e.g. Main Office, Home" },
    { name: "street_1", kind: "text", label: "Street Address", required: true, placeholder: "e.g. 123 Main Street" },
    { name: "building", kind: "text", label: "Building / Unit", placeholder: "e.g. Block A, Apt 4B" },
    { name: "street_2", kind: "text", label: "Street Line 2", placeholder: "e.g. Near City Park" },
    { name: "city", kind: "text", label: "City", required: true, placeholder: "e.g. Colombo" },
    { name: "state", kind: "text", label: "State / Province", placeholder: "e.g. Western Province" },
    { name: "postal_code", kind: "text", label: "Postal Code", placeholder: "e.g. 00100" },
    { name: "country", kind: "text", label: "Country", required: true, placeholder: "e.g. Sri Lanka" },
  ],
  layout: [
    { columns: [{ fields: ["name"], span: 12 }] },
    { columns: [{ fields: ["street_1"], span: 12 }] },
    {
      columns: [
        { fields: ["building"], span: 6 },
        { fields: ["street_2"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["city"], span: 6 },
        { fields: ["state"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["postal_code"], span: 6 },
        { fields: ["country"], span: 6 },
      ],
    },
  ],
  submitLabel: "Create Address",
}
