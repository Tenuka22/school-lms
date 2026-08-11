"use client"

import type { FormConfig } from "@/lib/form-builder"
import type { CreateAddressBody } from "@/lib/api-client/types.gen"

export type AddressFormValues = CreateAddressBody

export const addressFormDefaults: AddressFormValues = {
  address_line_1: "",
  address_line_2: null,
  city: "Galle",
  district: "Galle",
  province: "Southern",
  gs_division: "",
  postal_code: null,
  latitude: null,
  longitude: null,
  distance_to_school_km: null,
  verified_by_map: false,
  residence_type: null,
  ownership_proof: null,
}

export const addressFormConfig: FormConfig<AddressFormValues> = {
  fields: [
    {
      name: "address_line_1",
      kind: "text",
      label: "Address Line 1",
      required: true,
      placeholder: "e.g. 123 Main Street",
    },
    {
      name: "address_line_2",
      kind: "text",
      label: "Address Line 2",
      placeholder: "e.g. Apt 4B",
    },
    { name: "city", kind: "text", label: "City", required: true },
    { name: "district", kind: "text", label: "District", required: true },
    { name: "province", kind: "text", label: "Province", required: true },
    { name: "gs_division", kind: "text", label: "GS Division", required: true },
    { name: "postal_code", kind: "text", label: "Postal Code" },
    {
      name: "residence_type",
      kind: "select",
      label: "Residence Type",
      options: [
        { value: "Owned", label: "Owned" },
        { value: "Rented", label: "Rented" },
        { value: "Relative", label: "Relative" },
        { value: "Other", label: "Other" },
      ],
      inputProps: { placeholder: "Select type" },
    },
  ],
  layout: [
    { columns: [{ fields: ["address_line_1"] }] },
    { columns: [{ fields: ["address_line_2"] }] },
    {
      columns: [
        { fields: ["city"], span: 4 },
        { fields: ["district"], span: 4 },
        { fields: ["province"], span: 4 },
      ],
    },
    {
      columns: [
        { fields: ["gs_division"], span: 6 },
        { fields: ["postal_code"], span: 6 },
      ],
    },
    { columns: [{ fields: ["residence_type"] }] },
  ],
}
