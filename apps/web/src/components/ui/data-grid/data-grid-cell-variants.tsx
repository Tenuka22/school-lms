"use client"

import { Check, File as FileIconComp, Upload, X } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { DataGridCellWrapper } from "@/components/ui/data-grid/data-grid-cell-wrapper"
import { useBadgeOverflow } from "@/hooks/use-badge-overflow"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import {
  formatDateForDisplay,
  formatDateToString,
  formatFileSize,
  getCellKey,
  getFileIcon,
  getLineCount,
  getUrlHref,
  parseLocalDate,
} from "@/lib/data-grid"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import {
  createBatchMutation,
  listBatchesOptions,
  listBatchesQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import type { EnrollmentBatch } from "@/lib/api-client/types.gen"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import type { DataGridCellProps, FileCellData } from "@/types/data-grid"

export function ShortTextCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string
  const [value, setValue] = React.useState(initialValue)
  const cellRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prevIsEditingRef = React.useRef(false)

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(initialValue)
    if (cellRef.current && !isEditing) {
      cellRef.current.textContent = initialValue
    }
  }

  const onBlur = React.useCallback(() => {
    const currentValue = cellRef.current?.textContent ?? ""
    if (!readOnly && currentValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: currentValue })
    }
    tableMeta?.onCellEditingStop?.()
  }, [tableMeta, rowIndex, columnId, initialValue, readOnly])

  const onInput = React.useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const currentValue = event.currentTarget.textContent ?? ""
      setValue(currentValue)
    },
    [],
  )

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === "Enter") {
          event.preventDefault()
          const currentValue = cellRef.current?.textContent ?? ""
          if (currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue,
            })
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true })
        } else if (event.key === "Tab") {
          event.preventDefault()
          const currentValue = cellRef.current?.textContent ?? ""
          if (currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue,
            })
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? "left" : "right",
          })
        } else if (event.key === "Escape") {
          event.preventDefault()
          setValue(initialValue)
          cellRef.current?.blur()
        }
      } else if (
        isFocused &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        setValue(event.key)

        queueMicrotask(() => {
          if (cellRef.current && cellRef.current.contentEditable === "true") {
            cellRef.current.textContent = event.key
            const range = document.createRange()
            const selection = window.getSelection()
            range.selectNodeContents(cellRef.current)
            range.collapse(false)
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        })
      }
    },
    [isEditing, isFocused, initialValue, tableMeta, rowIndex, columnId],
  )

  React.useEffect(() => {
    const wasEditing = prevIsEditingRef.current
    prevIsEditingRef.current = isEditing

    if (isEditing && !wasEditing && cellRef.current) {
      cellRef.current.focus()

      if (!cellRef.current.textContent && value) {
        cellRef.current.textContent = value
      }

      if (cellRef.current.textContent) {
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(cellRef.current)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }, [isEditing, value])

  const displayValue = !isEditing ? (value ?? "") : ""

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      <div
        role="textbox"
        data-slot="grid-cell-content"
        contentEditable={isEditing}
        tabIndex={-1}
        ref={cellRef}
        onBlur={onBlur}
        onInput={onInput}
        suppressContentEditableWarning
        className={cn("size-full overflow-hidden outline-none", {
          "whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden":
            isEditing,
        })}
      >
        {displayValue}
      </div>
    </DataGridCellWrapper>
  )
}

export function LongTextCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string
  const [value, setValue] = React.useState(initialValue ?? "")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const pendingCharRef = React.useRef<string | null>(null)
  const sideOffset = -(containerRef.current?.clientHeight ?? 0)

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(initialValue ?? "")
  }

  const debouncedSave = useDebouncedCallback((newValue: string) => {
    if (!readOnly) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue })
    }
  }, 300)

  const onSave = React.useCallback(() => {
    if (!readOnly && value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value })
    }
    tableMeta?.onCellEditingStop?.()
  }, [tableMeta, value, initialValue, rowIndex, columnId, readOnly])

  const onCancel = React.useCallback(() => {
    setValue(initialValue ?? "")
    if (!readOnly) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: initialValue })
    }
    tableMeta?.onCellEditingStop?.()
  }, [tableMeta, initialValue, rowIndex, columnId, readOnly])

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId)
      } else {
        if (!readOnly && value !== initialValue) {
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value })
        }
        tableMeta?.onCellEditingStop?.()
      }
    },
    [tableMeta, value, initialValue, rowIndex, columnId, readOnly],
  )

  const handleInitialFocus = React.useCallback(() => {
    if (textareaRef.current) {
      if (pendingCharRef.current) {
        const char = pendingCharRef.current
        pendingCharRef.current = null
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            document.execCommand("insertText", false, char)
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight
          }
        })
      } else {
        requestAnimationFrame(() => {
          textareaRef.current?.scrollTo(0, textareaRef.current?.scrollHeight)
        })
      }
      return textareaRef.current
    }
    return null
  }, [])

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        isFocused &&
        !isEditing &&
        !readOnly &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        pendingCharRef.current = event.key
      }
    },
    [isFocused, isEditing, readOnly],
  )

  const onBlur = React.useCallback(() => {
    if (!readOnly && value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value })
    }
    tableMeta?.onCellEditingStop?.()
  }, [tableMeta, value, initialValue, rowIndex, columnId, readOnly])

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value
      setValue(newValue)
      debouncedSave(newValue)
    },
    [debouncedSave],
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
      } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        onSave()
      } else if (event.key === "Tab") {
        event.preventDefault()
        if (value !== initialValue) {
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value })
        }
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        })
        return
      }
      event.stopPropagation()
    },
    [onSave, onCancel, value, initialValue, tableMeta, rowIndex, columnId],
  )

  return (
    <Popover open={isEditing} onOpenChange={onOpenChange}>
        <PopoverAnchor>
        <DataGridCellWrapper<TData>
          ref={containerRef}
          cell={cell}
          tableMeta={tableMeta}
          rowIndex={rowIndex}
          columnId={columnId}
          rowHeight={rowHeight}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          isSearchMatch={isSearchMatch}
          isActiveSearchMatch={isActiveSearchMatch}
          readOnly={readOnly}
          onKeyDown={onWrapperKeyDown}
        >
          <span data-slot="grid-cell-content">{value}</span>
        </DataGridCellWrapper>
      </PopoverAnchor>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        side="bottom"
        sideOffset={sideOffset}
        className="w-[400px] rounded-none p-0"
        initialFocus={handleInitialFocus}
      >
        <Textarea
          placeholder="Enter text..."
          className="max-h-[300px] min-h-[150px] resize-none overflow-y-auto rounded-none border-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          ref={textareaRef}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </PopoverContent>
    </Popover>
  )
}

export function NumberCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as number
  const [value, setValue] = React.useState(String(initialValue ?? ""))
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const cellOpts = cell.column.columnDef.meta?.cell
  const numberCellOpts = cellOpts?.variant === "number" ? cellOpts : null
  const min = numberCellOpts?.min
  const max = numberCellOpts?.max
  const step = numberCellOpts?.step

  const prevIsEditingRef = React.useRef(false)

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(String(initialValue ?? ""))
  }

  const onBlur = React.useCallback(() => {
    const numValue = value === "" ? null : Number(value)
    if (!readOnly && numValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numValue })
    }
    tableMeta?.onCellEditingStop?.()
  }, [tableMeta, rowIndex, columnId, initialValue, value, readOnly])

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value)
    },
    [],
  )

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === "Enter") {
          event.preventDefault()
          const numValue = value === "" ? null : Number(value)
          if (numValue !== initialValue) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numValue })
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true })
        } else if (event.key === "Tab") {
          event.preventDefault()
          const numValue = value === "" ? null : Number(value)
          if (numValue !== initialValue) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numValue })
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? "left" : "right",
          })
        } else if (event.key === "Escape") {
          event.preventDefault()
          setValue(String(initialValue ?? ""))
          inputRef.current?.blur()
        }
      } else if (isFocused) {
        if (event.key === "Backspace") {
          setValue("")
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          setValue(event.key)
        }
      }
    },
    [isEditing, isFocused, initialValue, tableMeta, rowIndex, columnId, value],
  )

  React.useEffect(() => {
    const wasEditing = prevIsEditingRef.current
    prevIsEditingRef.current = isEditing

    if (isEditing && !wasEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      {isEditing ? (
        <input
          type="number"
          ref={inputRef}
          value={value}
          min={min}
          max={max}
          step={step}
          className="w-full border-none bg-transparent p-0 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          onBlur={onBlur}
          onChange={onChange}
        />
      ) : (
        <span data-slot="grid-cell-content">{value}</span>
      )}
    </DataGridCellWrapper>
  )
}

export function UrlCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string
  const [value, setValue] = React.useState(initialValue ?? "")
  const cellRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prevIsEditingRef = React.useRef(false)

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(initialValue ?? "")
    if (cellRef.current && !isEditing) {
      cellRef.current.textContent = initialValue ?? ""
    }
  }

  const onBlur = React.useCallback(() => {
    const currentValue = cellRef.current?.textContent?.trim() ?? ""

    if (!readOnly && currentValue !== initialValue) {
      tableMeta?.onDataUpdate?.({
        rowIndex,
        columnId,
        value: currentValue || null,
      })
    }
    tableMeta?.onCellEditingStop?.()
  }, [tableMeta, rowIndex, columnId, initialValue, readOnly])

  const onInput = React.useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const currentValue = event.currentTarget.textContent ?? ""
      setValue(currentValue)
    },
    [],
  )

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === "Enter") {
          event.preventDefault()
          const currentValue = cellRef.current?.textContent?.trim() ?? ""
          if (!readOnly && currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue || null,
            })
          }
          tableMeta?.onCellEditingStop?.({ moveToNextRow: true })
        } else if (event.key === "Tab") {
          event.preventDefault()
          const currentValue = cellRef.current?.textContent?.trim() ?? ""
          if (!readOnly && currentValue !== initialValue) {
            tableMeta?.onDataUpdate?.({
              rowIndex,
              columnId,
              value: currentValue || null,
            })
          }
          tableMeta?.onCellEditingStop?.({
            direction: event.shiftKey ? "left" : "right",
          })
        } else if (event.key === "Escape") {
          event.preventDefault()
          setValue(initialValue ?? "")
          cellRef.current?.blur()
        }
      } else if (
        isFocused &&
        !readOnly &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        setValue(event.key)

        queueMicrotask(() => {
          if (cellRef.current && cellRef.current.contentEditable === "true") {
            cellRef.current.textContent = event.key
            const range = document.createRange()
            const selection = window.getSelection()
            range.selectNodeContents(cellRef.current)
            range.collapse(false)
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        })
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
    ],
  )

  const onLinkClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (isEditing) {
        event.preventDefault()
        return
      }

      const href = getUrlHref(value)
      if (!href) {
        event.preventDefault()
        toast.error("Invalid URL", {
          description:
            "URL contains a dangerous protocol (javascript:, data:, vbscript:, or file:)",
        })
        return
      }

      event.stopPropagation()
    },
    [isEditing, value],
  )

  React.useEffect(() => {
    const wasEditing = prevIsEditingRef.current
    prevIsEditingRef.current = isEditing

    if (isEditing && !wasEditing && cellRef.current) {
      cellRef.current.focus()

      if (!cellRef.current.textContent && value) {
        cellRef.current.textContent = value
      }

      if (cellRef.current.textContent) {
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(cellRef.current)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }, [isEditing, value])

  const displayValue = !isEditing ? (value ?? "") : ""
  const urlHref = displayValue ? getUrlHref(displayValue) : ""
  const isDangerousUrl = displayValue && !urlHref

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      {!isEditing && displayValue ? (
        <div
          data-slot="grid-cell-content"
          className="size-full overflow-hidden"
        >
          <a
            data-focused={isFocused && !isDangerousUrl ? "" : undefined}
            data-invalid={isDangerousUrl ? "" : undefined}
            href={urlHref}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 data-invalid:cursor-not-allowed data-focused:text-foreground data-invalid:text-destructive data-focused:decoration-foreground/50 data-invalid:decoration-destructive/50 data-focused:hover:decoration-foreground/70 data-invalid:hover:decoration-destructive/70"
            onClick={onLinkClick}
          >
            {displayValue}
          </a>
        </div>
      ) : (
        <div
          role="textbox"
          data-slot="grid-cell-content"
          contentEditable={isEditing}
          tabIndex={-1}
          ref={cellRef}
          onBlur={onBlur}
          onInput={onInput}
          suppressContentEditableWarning
          className={cn("size-full overflow-hidden outline-none", {
            "whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden":
              isEditing,
          })}
        >
          {displayValue}
        </div>
      )}
    </DataGridCellWrapper>
  )
}

export function CheckboxCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: Omit<DataGridCellProps<TData>, "isEditing">) {
  const initialValue = cell.getValue() as boolean
  const [value, setValue] = React.useState(Boolean(initialValue))
  const containerRef = React.useRef<HTMLDivElement>(null)

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(Boolean(initialValue))
  }

  const onCheckedChange = React.useCallback(
    (checked: boolean) => {
      if (readOnly) return
      setValue(checked)
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: checked })
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        isFocused &&
        !readOnly &&
        (event.key === " " || event.key === "Enter")
      ) {
        event.preventDefault()
        event.stopPropagation()
        onCheckedChange(!value)
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault()
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        })
      }
    },
    [isFocused, value, onCheckedChange, tableMeta, readOnly],
  )

  const onWrapperClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (isFocused && !readOnly) {
        event.preventDefault()
        event.stopPropagation()
        onCheckedChange(!value)
      }
    },
    [isFocused, value, onCheckedChange, readOnly],
  )

  const onCheckboxClick = React.useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation()
  }, [])

  const onCheckboxMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation()
    },
    [],
  )

  const onCheckboxDoubleClick = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation()
    },
    [],
  )

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={false}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      className="flex size-full justify-center"
      onClick={onWrapperClick}
      onKeyDown={onWrapperKeyDown}
    >
      <Checkbox
        checked={value}
        onCheckedChange={onCheckedChange}
        disabled={readOnly}
        className="border-primary"
        onClick={onCheckboxClick}
        onMouseDown={onCheckboxMouseDown}
        onDoubleClick={onCheckboxDoubleClick}
      />
    </DataGridCellWrapper>
  )
}

export function SelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string
  const [value, setValue] = React.useState(initialValue)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const cellOpts = cell.column.columnDef.meta?.cell
  const options = React.useMemo(
    () => (cellOpts?.variant === "select" ? cellOpts.options : []),
    [cellOpts],
  )
  const optionByValue = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  )

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(initialValue)
  }

  const onValueChange = React.useCallback(
    (newValue: string | null) => {
      if (readOnly || newValue === null) return
      setValue(newValue)
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue })
      tableMeta?.onCellEditingStop?.()
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId)
      } else {
        tableMeta?.onCellEditingStop?.()
      }
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault()
        setValue(initialValue)
        tableMeta?.onCellEditingStop?.()
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault()
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        })
      }
    },
    [isEditing, isFocused, initialValue, tableMeta],
  )

  const displayLabel = optionByValue.get(value)?.label ?? value

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      {isEditing ? (
        <Select
          value={value}
          onValueChange={onValueChange}
          open={isEditing}
          onOpenChange={onOpenChange}
        >
          <SelectTrigger
            size="sm"
            className="size-full items-start border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent [&_svg]:hidden"
          >
            {displayLabel ? (
              <Badge
                variant="secondary"
                className="whitespace-pre-wrap px-1.5 py-px"
              >
                <SelectValue />
              </Badge>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent
            data-grid-cell-editor=""
            align="start"
            alignOffset={-8}
            sideOffset={-8}
            className="min-w-[calc(var(--anchor-width)+16px)]"
          >
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : displayLabel ? (
        <Badge
          data-slot="grid-cell-content"
          variant="secondary"
          className="whitespace-pre-wrap px-1.5 py-px"
        >
          {displayLabel}
        </Badge>
      ) : null}
    </DataGridCellWrapper>
  )
}

export function MultiSelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const cellValue = React.useMemo(() => {
    const value = cell.getValue() as string[]
    return value ?? []
  }, [cell])

  const cellKey = getCellKey(rowIndex, columnId)
  const prevCellKeyRef = React.useRef(cellKey)

  const [selectedValues, setSelectedValues] =
    React.useState<string[]>(cellValue)
  const [searchValue, setSearchValue] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const cellOpts = cell.column.columnDef.meta?.cell
  const options = React.useMemo(
    () => (cellOpts?.variant === "multi-select" ? cellOpts.options : []),
    [cellOpts],
  )
  const optionByValue = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  )
  const sideOffset = -(containerRef.current?.clientHeight ?? 0)

  const prevCellValueRef = React.useRef(cellValue)
  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue
    setSelectedValues(cellValue)
  }

  if (prevCellKeyRef.current !== cellKey) {
    prevCellKeyRef.current = cellKey
    setSearchValue("")
  }

  const onValueChange = React.useCallback(
    (value: string) => {
      if (readOnly) return
      let newValues: string[] = []
      setSelectedValues((curr) => {
        newValues = curr.includes(value)
          ? curr.filter((v) => v !== value)
          : [...curr, value]
        return newValues
      })
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues })
        inputRef.current?.focus()
      })
      setSearchValue("")
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const removeValue = React.useCallback(
    (valueToRemove: string, event?: React.MouseEvent) => {
      if (readOnly) return
      event?.stopPropagation()
      event?.preventDefault()
      let newValues: string[] = []
      setSelectedValues((curr) => {
        newValues = curr.filter((v) => v !== valueToRemove)
        return newValues
      })
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues })
        inputRef.current?.focus()
      })
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const clearAll = React.useCallback(() => {
    if (readOnly) return
    setSelectedValues([])
    tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: [] })
    queueMicrotask(() => inputRef.current?.focus())
  }, [tableMeta, rowIndex, columnId, readOnly])

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId)
      } else {
        setSearchValue("")
        tableMeta?.onCellEditingStop?.()
      }
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const handleInitialFocus = React.useCallback(() => {
    inputRef.current?.focus()
    return inputRef.current
  }, [])

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault()
        setSelectedValues(cellValue)
        setSearchValue("")
        tableMeta?.onCellEditingStop?.()
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault()
        setSearchValue("")
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        })
      }
    },
    [isEditing, isFocused, cellValue, tableMeta],
  )

  const onInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace" && searchValue === "") {
        event.preventDefault()
        let newValues: string[] | null = null
        setSelectedValues((curr) => {
          if (curr.length === 0) return curr
          newValues = curr.slice(0, -1)
          return newValues
        })
        queueMicrotask(() => {
          if (newValues !== null) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues })
          }
          inputRef.current?.focus()
        })
      }
      if (event.key === "Escape") {
        event.stopPropagation()
      }
    },
    [searchValue, tableMeta, rowIndex, columnId],
  )

  const displayLabels = selectedValues
    .map((val) => optionByValue.get(val)?.label ?? val)
    .filter(Boolean)

  const selectedValuesSet = React.useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  )

  const lineCount = getLineCount(rowHeight)

  const { visibleItems: visibleLabels, hiddenCount: hiddenBadgeCount } =
    useBadgeOverflow({
      items: displayLabels,
      getLabel: (label) => label,
      containerRef,
      lineCount,
    })

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      {isEditing ? (
        <Popover open={isEditing} onOpenChange={onOpenChange}>
          <PopoverAnchor>
            <div className="absolute inset-0" />
          </PopoverAnchor>
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            sideOffset={sideOffset}
            className="w-[300px] rounded-none p-0"
            initialFocus={handleInitialFocus}
          >
            <Command className="**:data-[slot=command-input-wrapper]:h-auto **:data-[slot=command-input-wrapper]:border-none **:data-[slot=command-input-wrapper]:p-0 [&_[data-slot=command-input-wrapper]_svg]:hidden">
              <div className="flex min-h-9 flex-wrap items-center gap-1 border-b px-3 py-1.5">
                {selectedValues.map((value) => {
                  const label = optionByValue.get(value)?.label ?? value

                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="gap-1 px-1.5 py-px"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={(event) => removeValue(value, event)}
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  )
                })}
                <CommandInput
                  ref={inputRef}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search..."
                  className="h-auto flex-1 p-0"
                />
              </div>
              <CommandList className="max-h-full">
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden">
                  {options.map((option) => {
                    const isSelected = selectedValuesSet.has(option.value)

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => onValueChange(option.value)}
                      >
                        <div
                          className={cn(
                            "flex size-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <Check className="size-3" />
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {selectedValues.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={clearAll}
                        className="justify-center text-muted-foreground"
                      >
                        Clear all
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : null}
      {displayLabels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {visibleLabels.map((label, index) => (
            <Badge
              key={selectedValues[index]}
              variant="secondary"
              className="px-1.5 py-px"
            >
              {label}
            </Badge>
          ))}
          {hiddenBadgeCount > 0 && (
            <Badge
              variant="outline"
              className="px-1.5 py-px text-muted-foreground"
            >
              +{hiddenBadgeCount}
            </Badge>
          )}
        </div>
      ) : null}
    </DataGridCellWrapper>
  )
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const

export function DateCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string
  const [value, setValue] = React.useState(initialValue ?? "")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(initialValue ?? "")
  }

  const selectedDate = value ? (parseLocalDate(value) ?? undefined) : undefined

  const cellOpts = cell.column.columnDef.meta?.cell
  const dateCellOpts = cellOpts?.variant === "date" ? cellOpts : null
  const pastYears = dateCellOpts?.pastYears ?? 100
  const futureYears = dateCellOpts?.futureYears ?? 0

  const [navMonth, setNavMonth] = React.useState(() => selectedDate ?? new Date())

  const onDateSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date || readOnly) return
      const formattedDate = formatDateToString(date)
      setValue(formattedDate)
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: formattedDate })
      tableMeta?.onCellEditingStop?.()
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const onOpenChange = React.useCallback(
    (open: boolean, eventDetails?: { reason?: string; cancel?: () => void }) => {
      if (!open && (eventDetails?.reason === "outside-press" || eventDetails?.reason === "focus-out")) {
        eventDetails?.cancel?.()
        return
      }
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId)
      } else {
        tableMeta?.onCellEditingStop?.()
      }
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault()
        setValue(initialValue)
        tableMeta?.onCellEditingStop?.()
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault()
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        })
      }
    },
    [isEditing, isFocused, initialValue, tableMeta],
  )

  const onMonthChange = React.useCallback((value: string) => {
    setNavMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(Number(value))
      return d
    })
  }, [])

  const onYearChange = React.useCallback((value: string) => {
    const year = Number(value)
    if (isNaN(year)) return
    setNavMonth((prev) => {
      const d = new Date(prev)
      d.setFullYear(year)
      return d
    })
  }, [])

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      <Popover open={isEditing} onOpenChange={onOpenChange}>
        <PopoverAnchor>
          <span data-slot="grid-cell-content">
            {formatDateForDisplay(value)}
          </span>
        </PopoverAnchor>
        {isEditing && (
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            alignOffset={-8}
            className="w-auto p-0"
          >
            <div className="flex items-center gap-1 border-b p-2">
              <Select value={String(navMonth.getMonth())} onValueChange={onMonthChange}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue children={(c) => Number(c)+1} />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, i) => (
                    <SelectItem key={i} value={String(i)}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(navMonth.getFullYear())} onValueChange={onYearChange}>
                <SelectTrigger className="h-8 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: pastYears + futureYears }, (_, i) => new Date().getFullYear() - pastYears + i).map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              autoFocus
              mode="single"
              month={navMonth}
              onMonthChange={setNavMonth}
              selected={selectedDate}
              onSelect={onDateSelect}
            />
          </PopoverContent>
        )}
      </Popover>
    </DataGridCellWrapper>
  )
}

export function BatchSelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string
  const [value, setValue] = React.useState(initialValue)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: allBatches } = useQuery({
    ...listBatchesOptions({ client: apiClient }),
  })

  const createMutation = useMutation({
    ...createBatchMutation({ client: apiClient }),
    onSuccess: (data) => {
      onValueChange(data.id!)
      queryClient.invalidateQueries({ queryKey: listBatchesQueryKey() })
    },
  })

  const currentYear = new Date().getFullYear()
  const [createType] = React.useState("G1")
  const [createYear, setCreateYear] = React.useState("")
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i)

  const selected = allBatches?.find((b) => b.id === value)

  const prevInitialValueRef = React.useRef(initialValue)
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue
    setValue(initialValue)
  }

  const formatLabel = React.useCallback(
    (batch: EnrollmentBatch) => `${batch.enrollment_type} ${batch.year} Admission`,
    [],
  )

  const onValueChange = React.useCallback(
    (newValue: string) => {
      if (readOnly) return
      setValue(newValue)
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue })
      tableMeta?.onCellEditingStop?.()
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId)
      } else {
        tableMeta?.onCellEditingStop?.()
      }
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const onWrapperKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault()
        setValue(initialValue)
        tableMeta?.onCellEditingStop?.()
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault()
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        })
      }
    },
    [isEditing, isFocused, initialValue, tableMeta],
  )

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
      onKeyDown={onWrapperKeyDown}
    >
      <Popover open={isEditing} onOpenChange={onOpenChange}>
        <PopoverAnchor className="size-full">
          {selected ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs">{formatLabel(selected)}</span>
              <span className="text-xs text-muted-foreground">{selected.batch_code}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select batch...</span>
          )}
        </PopoverAnchor>
        {isEditing && (
          <PopoverContent
            data-grid-cell-editor=""
            align="start"
            className="w-80 p-1"
          >
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {allBatches?.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => onValueChange(batch.id!)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors hover:bg-muted",
                    batch.id === value && "border-primary bg-primary/5",
                  )}
                >
                  <div className="font-medium text-sm">
                    {formatLabel(batch)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {batch.batch_code}
                  </div>
                </button>
              ))}
              {allBatches?.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No batches available.</p>
              )}
            </div>

            <div className="border-t p-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Create new batch</p>
              <div className="flex gap-2">
                <Select value={createType} disabled>
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G1">G1</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={createYear} onValueChange={(v) => v && setCreateYear(v)}>
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!createYear || createMutation.isPending}
                  onClick={() =>
                    createMutation.mutate({
                      body: { enrollment_type: "G1", year: Number(createYear) },
                      client: apiClient,
                    })
                  }
                >
                  {createMutation.isPending ? "..." : "Create"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        )}
      </Popover>
    </DataGridCellWrapper>
  )
}

export function FileCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const cellValue = React.useMemo(
    () => (cell.getValue() as FileCellData[]) ?? [],
    [cell],
  )

  const cellKey = getCellKey(rowIndex, columnId)
  const prevCellKeyRef = React.useRef(cellKey)

  const [files, setFiles] = React.useState<FileCellData[]>(cellValue)
  const [uploadingFiles, setUploadingFiles] = React.useState<Set<string>>(
    new Set(),
  )
  const [deletingFiles, setDeletingFiles] = React.useState<Set<string>>(
    new Set(),
  )
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isUploading = uploadingFiles.size > 0
  const isDeleting = deletingFiles.size > 0
  const isPending = isUploading || isDeleting
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dropzoneRef = React.useRef<HTMLDivElement>(null)
  const cellOpts = cell.column.columnDef.meta?.cell
  const sideOffset = -(containerRef.current?.clientHeight ?? 0)

  const fileCellOpts = cellOpts?.variant === "file" ? cellOpts : null
  const maxFileSize = fileCellOpts?.maxFileSize ?? 10 * 1024 * 1024
  const maxFiles = fileCellOpts?.maxFiles ?? 10
  const accept = fileCellOpts?.accept
  const multiple = fileCellOpts?.multiple ?? false

  const acceptedTypes = React.useMemo(
    () => (accept ? accept.split(",").map((t) => t.trim()) : null),
    [accept],
  )

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId)
      } else {
        tableMeta?.onCellEditingStop?.()
      }
    },
    [tableMeta, rowIndex, columnId, readOnly],
  )

  const prevCellValueRef = React.useRef(cellValue)
  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue
    for (const file of files) {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    }
    setFiles(cellValue)
    setError(null)
  }

  if (prevCellKeyRef.current !== cellKey) {
    prevCellKeyRef.current = cellKey
    setError(null)
  }

  const validateFile = React.useCallback(
    (file: File): string | null => {
      if (maxFileSize && file.size > maxFileSize) {
        return `File size exceeds ${formatFileSize(maxFileSize)}`
      }
      if (acceptedTypes) {
        const fileExtension = `.${file.name.split(".").pop()}`
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            const baseType = type.slice(0, -2)
            return file.type.startsWith(`${baseType}/`)
          }
          if (type.startsWith(".")) {
            return fileExtension.toLowerCase() === type.toLowerCase()
          }
          return file.type === type
        })
        if (!isAccepted) {
          return "File type not accepted"
        }
      }
      return null
    },
    [maxFileSize, acceptedTypes],
  )

  const addFiles = React.useCallback(
    async (newFiles: File[], skipUpload = false) => {
      if (readOnly || isPending) return
      setError(null)

      if (maxFiles && files.length + newFiles.length > maxFiles) {
        const errorMessage = `Maximum ${maxFiles} files allowed`
        setError(errorMessage)
        toast(errorMessage)
        setTimeout(() => {
          setError(null)
        }, 2000)
        return
      }

      const rejectedFiles: Array<{ name: string; reason: string }> = []
      const filesToValidate: File[] = []

      for (const file of newFiles) {
        const validationError = validateFile(file)
        if (validationError) {
          rejectedFiles.push({ name: file.name, reason: validationError })
          continue
        }
        filesToValidate.push(file)
      }

      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0]
        if (firstError) {
          setError(firstError.reason)

          const truncatedName =
            firstError.name.length > 20
              ? `${firstError.name.slice(0, 20)}...`
              : firstError.name

          if (rejectedFiles.length === 1) {
            toast(firstError.reason, {
              description: `"${truncatedName}" has been rejected`,
            })
          } else {
            toast(firstError.reason, {
              description: `"${truncatedName}" and ${rejectedFiles.length - 1} more rejected`,
            })
          }

          setTimeout(() => {
            setError(null)
          }, 2000)
        }
      }

      if (filesToValidate.length > 0) {
        if (!skipUpload) {
          const tempFiles = filesToValidate.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name,
            size: f.size,
            type: f.type,
            url: undefined,
          }))
          const filesWithTemp = [...files, ...tempFiles]
          setFiles(filesWithTemp)

          const uploadingIds = new Set<string>(tempFiles.map((f) => f.id))
          setUploadingFiles(uploadingIds)

          let uploadedFiles: FileCellData[] = []

          if (tableMeta?.onFilesUpload) {
            try {
              uploadedFiles = await tableMeta.onFilesUpload({
                files: filesToValidate,
                rowIndex,
                columnId,
              })
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : `Failed to upload ${filesToValidate.length} file${filesToValidate.length !== 1 ? "s" : ""}`,
              )
              setFiles((prev) => prev.filter((f) => !uploadingIds.has(f.id)))
              setUploadingFiles(new Set())
              return
            }
          } else {
            uploadedFiles = filesToValidate.map((f, i) => ({
              id: tempFiles[i]?.id ?? crypto.randomUUID(),
              name: f.name,
              size: f.size,
              type: f.type,
              url: URL.createObjectURL(f),
            }))
          }

          const finalFiles = filesWithTemp
            .map((f) => {
              if (uploadingIds.has(f.id)) {
                return uploadedFiles.find((uf) => uf.name === f.name) ?? f
              }
              return f
            })
            .filter((f) => f.url !== undefined)

          setFiles(finalFiles)
          setUploadingFiles(new Set())
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: finalFiles })
        } else {
          const newFilesData: FileCellData[] = filesToValidate.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name,
            size: f.size,
            type: f.type,
            url: URL.createObjectURL(f),
          }))
          const updatedFiles = [...files, ...newFilesData]
          setFiles(updatedFiles)
          tableMeta?.onDataUpdate?.({
            rowIndex,
            columnId,
            value: updatedFiles,
          })
        }
      }
    },
    [
      files,
      maxFiles,
      validateFile,
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      isPending,
    ],
  )

  const removeFile = React.useCallback(
    async (fileId: string) => {
      if (readOnly || isPending) return
      setError(null)

      const fileToRemove = files.find((f) => f.id === fileId)

      if (!fileToRemove) return

      setDeletingFiles((prev) => new Set(prev).add(fileId))

      if (tableMeta?.onFilesDelete) {
        try {
          await tableMeta.onFilesDelete({
            fileIds: [fileId],
            rowIndex,
            columnId,
          })
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to delete file",
          )
          setDeletingFiles((prev) => {
            const next = new Set(prev)
            next.delete(fileId)
            return next
          })
          return
        }
      }

      const updatedFiles = files.filter((f) => f.id !== fileId)
      setFiles(updatedFiles)
      if (fileToRemove.url) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      setDeletingFiles((prev) => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: updatedFiles })
    },
    [files, tableMeta, rowIndex, columnId, readOnly, isPending],
  )

  const onFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files
      if (!fileList || fileList.length === 0) return
      addFiles(Array.from(fileList))
      event.target.value = ""
    },
    [addFiles],
  )

  if (!isEditing) {
    const FileIcon = files.length > 0 ? getFileIcon(files[0]?.type ?? "") : FileIconComp

    return (
      <DataGridCellWrapper<TData>
        ref={containerRef}
        cell={cell}
        tableMeta={tableMeta}
        rowIndex={rowIndex}
        columnId={columnId}
        rowHeight={rowHeight}
        isEditing={false}
        isFocused={isFocused}
        isSelected={isSelected}
        isSearchMatch={isSearchMatch}
        isActiveSearchMatch={isActiveSearchMatch}
        readOnly={readOnly}
        className="flex items-center gap-1"
      >
        {files.length > 0 ? (
          <Badge variant="secondary" className="gap-1 px-1.5 py-px text-xs">
            {files.length === 1 ? (
              <>
                <FileIcon className="size-3" />
                {files[0]?.name}
              </>
            ) : (
              <>{files.length} files</>
            )}
          </Badge>
        ) : (
          <span data-slot="grid-cell-content" className="text-muted-foreground">
            No files
          </span>
        )}
      </DataGridCellWrapper>
    )
  }

  return (
    <DataGridCellWrapper<TData>
      ref={containerRef}
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
    >
      <Popover open={isEditing} onOpenChange={onOpenChange}>
        <PopoverAnchor>
          <span className="flex items-center gap-1">
            {files.length > 0 ? (
              <Badge variant="secondary" className="gap-1 px-1.5 py-px text-xs">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </Badge>
            ) : (
              <span className="text-muted-foreground">No files</span>
            )}
          </span>
        </PopoverAnchor>
        <PopoverContent
          data-grid-cell-editor=""
          align="start"
          sideOffset={sideOffset}
          className="w-[400px] rounded-none p-0"
        >
          <div className="flex flex-col">
            {error && (
              <div className="border-b border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            <div
              ref={dropzoneRef}
              className={cn(
                "flex flex-col items-center justify-center gap-2 border-b border-border p-4 transition-colors",
                isDraggingOver && "bg-primary/5",
              )}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDraggingOver(true)
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDraggingOver(false)
              }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDraggingOver(false)
                const droppedFiles = Array.from(e.dataTransfer.files)
                if (droppedFiles.length > 0) {
                  await addFiles(droppedFiles)
                }
              }}
            >
              <Upload className="size-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Drag and drop files here, or{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                className="hidden"
                onChange={onFileInputChange}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {files.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                  No files uploaded
                </div>
              ) : (
                <div className="flex flex-col">
                  {files.map((file) => {
                    const FileIcon = getFileIcon(file.type)
                    const isUploadingFile = uploadingFiles.has(file.id)
                    const isDeletingFile = deletingFiles.has(file.id)

                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs last:border-b-0"
                      >
                        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">
                            {file.name}
                          </span>
                          <span className="text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        {isUploadingFile ? (
                          <Skeleton className="size-4 rounded-full" />
                        ) : isDeletingFile ? (
                          <Skeleton className="size-4 rounded-full" />
                        ) : (
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeFile(file.id)}
                            disabled={readOnly}
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </DataGridCellWrapper>
  )
}
